"""
FastAPI wrapper for SmartSignLanguage landmark sequence models.

Each model expects rolling MediaPipe feature sequences with 225 features per
frame: left hand, right hand, and pose.
"""

from __future__ import annotations

import base64
import logging
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any

import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from inference import wlasl_landmark_pipeline as pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def ai_model_dir() -> Path:
    return Path(__file__).resolve().parents[1]


def model_dir() -> Path:
    return ai_model_dir() / "model"


def hand_landmarker_path() -> Path:
    return model_dir() / "hand_landmarker.task"


app = FastAPI(
    title="SmartSignLanguage Recognition API",
    description="Realtime ASL recognition using MediaPipe hands+pose landmarks and Keras",
    version="6.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models: dict[str, pipeline.WlaslLandmarkSequenceModel] = {}
MIN_VIDEO_HAND_FRAMES_FOR_RESAMPLE = 1


def normalize_mode(mode: str = "words") -> str:
    normalized_mode = mode.lower().strip()
    mode_aliases = {
        "number": "numbers",
        "digit": "numbers",
        "digits": "numbers",
    }
    return mode_aliases.get(normalized_mode, normalized_mode)


def get_model(mode: str = "words") -> pipeline.WlaslLandmarkSequenceModel:
    normalized_mode = normalize_mode(mode)
    if normalized_mode not in models:
        raise HTTPException(
            status_code=404,
            detail=f"Recognition mode '{mode}' is not available",
        )
    return models[normalized_mode]


def model_summary(mode: str, loaded_model: pipeline.WlaslLandmarkSequenceModel) -> dict[str, Any]:
    return {
        "mode": mode,
        "model": loaded_model.name,
        "model_path": str(loaded_model.model_path),
        "mapping_path": str(loaded_model.mapping_path),
        "hand_landmarker_path": str(loaded_model.hand_task_path),
        "pose_landmarker_path": str(loaded_model.pose_task_path),
        "num_gestures": len(loaded_model.labels),
        "gestures": loaded_model.labels,
        "sequence_length": loaded_model.sequence_length,
        "frames_ready": len(loaded_model.sequence),
        "training_metadata": loaded_model.metadata_summary(),
    }


@app.on_event("startup")
def startup_event() -> None:
    global models

    assets_dir = model_dir()
    loaded_models: dict[str, pipeline.WlaslLandmarkSequenceModel] = {}

    loaded_models["words"] = pipeline.WlaslLandmarkSequenceModel(
        assets_dir / "model_landmarks.keras",
        assets_dir / "mapping.json",
        hand_landmarker_path(),
        assets_dir / "pose_landmarker.task",
        name="Words Landmark Keras",
    )

    alnum_model_path = assets_dir / "model_alnum.keras"
    alnum_mapping_path = assets_dir / "mapping_alnum.json"
    if alnum_model_path.exists() and alnum_mapping_path.exists():
        loaded_models["alnum"] = pipeline.WlaslLandmarkSequenceModel(
            alnum_model_path,
            alnum_mapping_path,
            hand_landmarker_path(),
            assets_dir / "pose_landmarker.task",
            name="Alphabet Landmark Keras",
            sequence_strategy="repeat_current",
            use_pose=False,
        )
    else:
        logger.warning(
            "Alphabet model unavailable. Expected %s and %s",
            alnum_model_path,
            alnum_mapping_path,
        )

    number_model_path = assets_dir / "model_number.keras"
    number_mapping_path = assets_dir / "mapping_number.json"
    if number_model_path.exists() and number_mapping_path.exists():
        loaded_models["numbers"] = pipeline.WlaslLandmarkSequenceModel(
            number_model_path,
            number_mapping_path,
            hand_landmarker_path(),
            assets_dir / "pose_landmarker.task",
            name="Number Landmark Keras",
            sequence_strategy="repeat_current",
            use_pose=False,
        )
    else:
        logger.warning(
            "Number model unavailable. Expected %s and %s",
            number_model_path,
            number_mapping_path,
        )

    models = loaded_models


@app.get("/health")
def health_check() -> dict[str, Any]:
    default_model = models.get("words")
    return {
        "status": "healthy" if models else "unhealthy",
        "backend": "wlasl-hands-pose-sequence",
        "model_loaded": bool(models),
        "available_modes": list(models.keys()),
        "models": {
            mode: model_summary(mode, loaded_model)
            for mode, loaded_model in models.items()
        },
        "model": default_model.name if default_model else "none",
        "model_path": str(default_model.model_path) if default_model else "",
        "mapping_path": str(default_model.mapping_path) if default_model else "",
        "hand_landmarker_path": str(default_model.hand_task_path) if default_model else "",
        "pose_landmarker_path": str(default_model.pose_task_path) if default_model else "",
        "num_gestures": len(default_model.labels) if default_model else 0,
        "gestures": default_model.labels if default_model else [],
        "sequence_length": default_model.sequence_length if default_model else pipeline.SEQ_LEN,
        "frames_ready": len(default_model.sequence) if default_model else 0,
        "tensorflow_available": pipeline.TENSORFLOW_AVAILABLE,
        "mediapipe_available": pipeline.MEDIAPIPE_AVAILABLE,
        "mediapipe_backend": default_model.extractor.backend if default_model else "",
        "timestamp": str(datetime.now()),
    }


@app.post("/api/predict")
async def predict(file: UploadFile = File(...), mode: str = "words") -> dict[str, Any]:
    mode = normalize_mode(mode)
    selected_model = get_model(mode)
    try:
        image_bgr = pipeline.image_bytes_to_bgr(await file.read())
        result = selected_model.predict(image_bgr)
        result["mode"] = mode.lower()
        return result
    except Exception as exc:
        logger.error("Prediction error: %s", exc, exc_info=True)
        return pipeline.response("error", f"Prediction failed: {exc}")


@app.post("/api/predict-base64")
async def predict_base64(data: dict[str, Any]) -> dict[str, Any]:
    mode = normalize_mode(str(data.get("mode") or "words"))
    selected_model = get_model(mode)
    try:
        base64_str = data.get("image")
        if not base64_str:
            raise ValueError("No image provided")
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]

        image_bgr = pipeline.image_bytes_to_bgr(base64.b64decode(base64_str))
        result = selected_model.predict(image_bgr)
        result["mode"] = mode.lower()
        return result
    except Exception as exc:
        logger.error("Base64 prediction error: %s", exc, exc_info=True)
        return pipeline.response("error", f"Prediction failed: {exc}")


@app.post("/api/batch-predict")
async def batch_predict(files: list[UploadFile] = File(...), mode: str = "words") -> dict[str, Any]:
    mode = normalize_mode(mode)
    selected_model = get_model(mode)
    results = []
    for file in files:
        try:
            prediction = selected_model.predict(pipeline.image_bytes_to_bgr(await file.read()))
            prediction["file"] = file.filename
            prediction["mode"] = mode.lower()
            results.append(prediction)
        except Exception as exc:
            results.append({"file": file.filename, "error": str(exc)})

    return {"results": results}


def sample_video_frame_indices(total_frames: int, sample_count: int) -> list[int]:
    if total_frames <= 0:
        return []
    if total_frames <= sample_count:
        return list(range(total_frames))
    if sample_count <= 1:
        return [total_frames // 2]

    start = min(max(int(total_frames * 0.05), 0), total_frames - 1)
    end = max(start, min(int(total_frames * 0.95), total_frames - 1))
    if start == end:
        return [start]

    return [
        round(start + ((end - start) * index) / (sample_count - 1))
        for index in range(sample_count)
    ]


def should_scan_video_sequentially(total_frames: int, sample_count: int) -> bool:
    return total_frames <= 0 or total_frames <= sample_count


def video_frame_variants(frame_bgr: pipeline.np.ndarray) -> list[pipeline.np.ndarray]:
    variants = [frame_bgr]
    height, width = frame_bgr.shape[:2]

    if max(width, height) < 960:
        scale = 960 / max(width, height)
        variants.append(
            pipeline.cv2.resize(
                frame_bgr,
                (int(width * scale), int(height * scale)),
                interpolation=pipeline.cv2.INTER_CUBIC,
            )
        )

    variants.append(pipeline.cv2.flip(frame_bgr, 1))

    if height > width:
        variants.append(pipeline.cv2.rotate(frame_bgr, pipeline.cv2.ROTATE_90_CLOCKWISE))
        variants.append(
            pipeline.cv2.rotate(frame_bgr, pipeline.cv2.ROTATE_90_COUNTERCLOCKWISE)
        )

    return variants


def predict_video_frame(
    selected_model: pipeline.WlaslLandmarkSequenceModel,
    frame_bgr: pipeline.np.ndarray,
) -> dict[str, Any]:
    first_prediction: dict[str, Any] | None = None

    for variant in video_frame_variants(frame_bgr):
        prediction = selected_model.predict(variant)
        if first_prediction is None:
            first_prediction = prediction
        if prediction.get("status") != "no_hand":
            return prediction

    return first_prediction or selected_model.predict(frame_bgr)


def predict_resampled_video_sequence(
    selected_model: pipeline.WlaslLandmarkSequenceModel,
    last_prediction: dict[str, Any],
) -> dict[str, Any] | None:
    if len(selected_model.sequence) < MIN_VIDEO_HAND_FRAMES_FOR_RESAMPLE:
        return None

    source_sequence = pipeline.np.array(selected_model.sequence, dtype=pipeline.np.float32)
    source_count = source_sequence.shape[0]
    target_count = selected_model.sequence_length
    sample_positions = pipeline.np.linspace(0, source_count - 1, target_count)
    sample_indices = pipeline.np.rint(sample_positions).astype(int)
    resampled_sequence = pipeline.normalize_sequence(source_sequence[sample_indices])

    raw_prediction = selected_model.model.predict(
        pipeline.np.array([resampled_sequence], dtype=pipeline.np.float32),
        verbose=0,
    )[0]
    prediction = pipeline.calibrate_probabilities(
        raw_prediction,
        selected_model.confidence_temperature,
    )
    class_id = int(pipeline.np.argmax(prediction))
    gesture = (
        selected_model.labels[class_id]
        if class_id < len(selected_model.labels)
        else f"Gesture_{class_id}"
    )

    top_indices = pipeline.np.argsort(prediction)[-5:][::-1]
    top_predictions = [
        {
            "class_id": int(index),
            "gesture": selected_model.labels[int(index)]
            if int(index) < len(selected_model.labels)
            else f"Gesture_{int(index)}",
            "confidence": float(prediction[int(index)]),
            "raw_confidence": float(raw_prediction[int(index)]),
        }
        for index in top_indices
    ]

    return pipeline.response(
        "success",
        gesture,
        confidence=float(prediction[class_id]),
        raw_confidence=float(raw_prediction[class_id]),
        class_id=class_id,
        landmarks=last_prediction.get("landmarks") or [],
        handedness=last_prediction.get("handedness") or [],
        confidence_scores=last_prediction.get("confidence_scores") or [],
        top_predictions=top_predictions,
        bbox=last_prediction.get("bbox"),
        model_name=selected_model.name,
        frames_ready=target_count,
        frames_required=target_count,
        confidence_temperature=selected_model.confidence_temperature,
    )


@app.post("/api/predict-video")
async def predict_video(
    file: UploadFile = File(...),
    mode: str = "words",
    sample_count: int = 240,
) -> dict[str, Any]:
    mode = normalize_mode(mode)
    selected_model = get_model(mode)
    selected_model.reset()

    suffix = Path(file.filename or "upload.mp4").suffix or ".mp4"
    temp_path = ""

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(await file.read())
            temp_path = temp_file.name

        capture = pipeline.cv2.VideoCapture(temp_path)
        if not capture.isOpened():
            return pipeline.response(
                "error",
                "Unable to read this video. Try an H.264 MP4 or WebM file.",
                model_name=selected_model.name,
                frames_required=selected_model.sequence_length,
            )

        total_frames = int(capture.get(pipeline.cv2.CAP_PROP_FRAME_COUNT))
        use_sequential_read = should_scan_video_sequentially(total_frames, sample_count)
        frame_indices = (
            list(range(sample_count))
            if use_sequential_read and total_frames <= 0
            else sample_video_frame_indices(total_frames, sample_count)
        )

        last_prediction: dict[str, Any] | None = None
        frames_processed = 0
        frames_with_hands = 0

        if not frame_indices:
            frame_indices = list(range(sample_count))
            use_sequential_read = True

        for frame_index in frame_indices:
            if not use_sequential_read:
                capture.set(pipeline.cv2.CAP_PROP_POS_FRAMES, frame_index)
            ok, frame_bgr = capture.read()
            if not ok or frame_bgr is None:
                continue

            frames_processed += 1
            prediction = predict_video_frame(selected_model, frame_bgr)
            prediction["mode"] = mode.lower()
            prediction["frames_processed"] = frames_processed
            prediction["frames_with_hands"] = len(selected_model.sequence)
            prediction["video_total_frames"] = total_frames
            last_prediction = prediction
            frames_with_hands = max(frames_with_hands, len(selected_model.sequence))

            if prediction.get("status") == "success":
                capture.release()
                selected_model.reset()
                return prediction

        capture.release()

        resampled_prediction = predict_resampled_video_sequence(
            selected_model,
            last_prediction or {},
        )
        if resampled_prediction:
            resampled_prediction["mode"] = mode.lower()
            resampled_prediction["frames_processed"] = frames_processed
            resampled_prediction["frames_with_hands"] = frames_with_hands
            resampled_prediction["video_total_frames"] = total_frames
            resampled_prediction["sequence_resampled"] = True
            selected_model.reset()
            return resampled_prediction

        selected_model.reset()

        if last_prediction:
            last_prediction["frames_processed"] = frames_processed
            last_prediction["frames_with_hands"] = frames_with_hands
            last_prediction["video_total_frames"] = total_frames
            if last_prediction.get("status") in {"warming_up", "no_hand"}:
                last_prediction["gesture"] = (
                    f"Detected {frames_with_hands}/{selected_model.sequence_length} "
                    "hand frames"
                )
            return last_prediction

        return pipeline.response(
            "no_hand",
            "No readable hand frames detected in this video.",
            model_name=selected_model.name,
            frames_required=selected_model.sequence_length,
        )
    except Exception as exc:
        logger.error("Video prediction error: %s", exc, exc_info=True)
        return pipeline.response("error", f"Video prediction failed: {exc}")
    finally:
        if temp_path:
            try:
                Path(temp_path).unlink(missing_ok=True)
            except Exception:
                logger.warning("Could not delete temp video: %s", temp_path)


@app.post("/api/reset-sequence")
def reset_sequence(mode: str = "words") -> dict[str, Any]:
    mode = normalize_mode(mode)
    selected_model = get_model(mode)
    selected_model.reset()
    return {"status": "success", "mode": mode.lower(), "frames_ready": 0}


@app.post("/api/reset-all-sequences")
def reset_all_sequences() -> dict[str, Any]:
    for loaded_model in models.values():
        loaded_model.reset()
    return {"status": "success", "modes": list(models.keys()), "frames_ready": 0}


@app.get("/api/gestures")
def list_gestures(mode: str = "words") -> dict[str, Any]:
    mode = normalize_mode(mode)
    selected_model = get_model(mode)
    return {
        "mode": mode.lower(),
        "gestures": selected_model.labels,
        "count": len(selected_model.labels),
        "model": selected_model.name,
        "training_metadata": selected_model.metadata_summary(),
    }


@app.get("/api/info")
def get_info() -> dict[str, Any]:
    return {
        "name": "SmartSignLanguage Recognition API",
        "version": "6.0.0",
        "backend": "wlasl-hands-pose-sequence",
        "model_loaded": bool(models),
        "available_modes": list(models.keys()),
        "models": {
            mode: model_summary(mode, loaded_model)
            for mode, loaded_model in models.items()
        },
        "supported_formats": ["image/jpeg", "image/png"],
        "endpoints": [
            "/health",
            "/api/predict",
            "/api/predict-base64",
            "/api/batch-predict",
            "/api/predict-video",
            "/api/reset-sequence",
            "/api/reset-all-sequences",
            "/api/gestures",
            "/api/info",
        ],
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

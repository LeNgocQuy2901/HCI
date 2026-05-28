"""
FastAPI wrapper for SmartSignLanguage landmark sequence models.

Each model expects rolling MediaPipe feature sequences with 225 features per
frame: left hand, right hand, and pose.
"""

from __future__ import annotations

import base64
import logging
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
            name="Alphabet/Number Landmark Keras",
        )
    else:
        logger.warning(
            "Alphabet/Number model unavailable. Expected %s and %s",
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
            "/api/reset-sequence",
            "/api/reset-all-sequences",
            "/api/gestures",
            "/api/info",
        ],
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

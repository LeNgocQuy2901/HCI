"""
FastAPI server for realtime sign recognition using only the legacy
Sign-to-Text converter pipeline.

Pipeline:
  camera frame -> MediaPipe Hands -> 21 * (x, y, z) landmarks -> gesture_model.h5
"""

import base64
import io
import json
import logging
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

try:
    import mediapipe as mp
except Exception:
    mp = None

try:
    from mediapipe.tasks import python as mp_tasks_python
    from mediapipe.tasks.python import vision as mp_tasks_vision
except Exception:
    mp_tasks_python = None
    mp_tasks_vision = None

try:
    from tensorflow.keras.models import load_model
except Exception:
    load_model = None

import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

HAND_LANDMARKER_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/1/hand_landmarker.task"
)


def legacy_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "legacy-converters" / "Sign-to-Text-Convertor"


def model_dir() -> Path:
    return Path(__file__).resolve().parents[1] / "model"


def ensure_hand_landmarker_task() -> Path:
    path = model_dir() / "hand_landmarker.task"
    if path.exists():
        return path

    path.parent.mkdir(parents=True, exist_ok=True)
    logger.info("Downloading MediaPipe hand landmarker task to %s", path)
    try:
        urllib.request.urlretrieve(HAND_LANDMARKER_URL, path)
    except Exception as exc:
        raise RuntimeError(
            "MediaPipe Tasks is installed without the legacy mp.solutions API, "
            f"and the hand landmarker model is missing. Download {HAND_LANDMARKER_URL} "
            f"to {path} or install a MediaPipe build that provides mp.solutions."
        ) from exc

    return path


class HandLandmarkExtractor:
    def __init__(self):
        if mp is None:
            raise RuntimeError("mediapipe is not installed")

        self.backend = ""
        self.solutions_hands = None
        self.tasks_landmarker = None

        if hasattr(mp, "solutions") and hasattr(mp.solutions, "hands"):
            self.backend = "mediapipe-solutions"
            self.solutions_hands = mp.solutions.hands.Hands(
                static_image_mode=False,
                max_num_hands=1,
                min_detection_confidence=0.25,
                min_tracking_confidence=0.25,
            )
            return

        if mp_tasks_python is None or mp_tasks_vision is None:
            raise RuntimeError(
                "mediapipe is installed, but neither mp.solutions nor mediapipe.tasks is available"
            )

        self.backend = "mediapipe-tasks"
        task_path = ensure_hand_landmarker_task()
        options = mp_tasks_vision.HandLandmarkerOptions(
            base_options=mp_tasks_python.BaseOptions(model_asset_path=str(task_path)),
            running_mode=mp_tasks_vision.RunningMode.IMAGE,
            num_hands=1,
            min_hand_detection_confidence=0.25,
            min_hand_presence_confidence=0.25,
        )
        self.tasks_landmarker = mp_tasks_vision.HandLandmarker.create_from_options(options)

    def process(self, image_rgb: np.ndarray) -> Optional[dict[str, Any]]:
        if self.solutions_hands is not None:
            results = self.solutions_hands.process(image_rgb)
            if not results.multi_hand_landmarks:
                return None

            hand_landmarks = results.multi_hand_landmarks[0]
            landmarks = [
                {"x": landmark.x, "y": landmark.y, "z": landmark.z}
                for landmark in hand_landmarks.landmark
            ]
            handedness = "Unknown"
            hand_confidence = 0.0

            if results.multi_handedness:
                classification = results.multi_handedness[0].classification[0]
                handedness = classification.label
                hand_confidence = float(classification.score)

            return {
                "landmarks": landmarks,
                "handedness": handedness,
                "hand_confidence": hand_confidence,
            }

        if self.tasks_landmarker is None:
            return None

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
        results = self.tasks_landmarker.detect(mp_image)
        if not results.hand_landmarks:
            return None

        hand_landmarks = results.hand_landmarks[0]
        landmarks = [
            {"x": landmark.x, "y": landmark.y, "z": landmark.z}
            for landmark in hand_landmarks
        ]
        handedness = "Unknown"
        hand_confidence = 0.0

        if results.handedness:
            category = results.handedness[0][0]
            handedness = category.category_name
            hand_confidence = float(category.score)

        return {
            "landmarks": landmarks,
            "handedness": handedness,
            "hand_confidence": hand_confidence,
        }


def load_label_mapping(labels_path: Path) -> list[str]:
    with labels_path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if isinstance(data, dict):
        return [str(data[str(index)]) for index in range(len(data))]
    if isinstance(data, list):
        return [str(label) for label in data]

    raise ValueError(f"Unsupported label mapping format: {labels_path}")


def image_bytes_to_bgr(contents: bytes) -> np.ndarray:
    if not contents:
        raise ValueError("No image bytes provided")

    image = Image.open(io.BytesIO(contents)).convert("RGB")
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)


def bbox_from_landmarks(
    landmarks: list[dict[str, float]], image_width: int, image_height: int
) -> list[int]:
    x_values = [point["x"] for point in landmarks]
    y_values = [point["y"] for point in landmarks]
    padding = 0.05

    x1 = max(0, int((min(x_values) - padding) * image_width))
    y1 = max(0, int((min(y_values) - padding) * image_height))
    x2 = min(image_width, int((max(x_values) + padding) * image_width))
    y2 = min(image_height, int((max(y_values) + padding) * image_height))
    return [x1, y1, x2, y2]


def response(
    status: str,
    gesture: str,
    confidence: float = 0.0,
    class_id: int = -1,
    landmarks: Optional[list[list[dict[str, float]]]] = None,
    handedness: Optional[list[str]] = None,
    confidence_scores: Optional[list[float]] = None,
    top_predictions: Optional[list[dict[str, Any]]] = None,
    bbox: Optional[list[int]] = None,
    model_name: str = "Legacy Sign-to-Text Keras",
) -> dict[str, Any]:
    return {
        "status": status,
        "gesture": gesture,
        "confidence": confidence,
        "class_id": class_id,
        "landmarks": landmarks or [],
        "handedness": handedness or [],
        "confidence_scores": confidence_scores or [],
        "top_predictions": top_predictions or [],
        "bbox": bbox,
        "model": model_name,
        "timestamp": str(datetime.now()),
    }


class LegacySignToTextModel:
    name = "Legacy Sign-to-Text Keras"

    def __init__(self, model_path: Path, labels_path: Path):
        if load_model is None:
            raise RuntimeError("tensorflow is not installed")
        if not model_path.exists():
            raise FileNotFoundError(model_path)
        if not labels_path.exists():
            raise FileNotFoundError(labels_path)

        self.model_path = model_path
        self.labels_path = labels_path
        self.labels = load_label_mapping(labels_path)
        self.model = load_model(str(model_path))
        self.extractor = HandLandmarkExtractor()

        logger.info(
            "Loaded %s from %s with labels %s using %s",
            self.name,
            self.model_path,
            self.labels_path,
            self.extractor.backend,
        )

    def extract_landmarks(self, image_bgr: np.ndarray) -> Optional[dict[str, Any]]:
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        extracted = self.extractor.process(image_rgb)
        if extracted is None:
            return None

        landmarks = extracted["landmarks"]
        features = np.array(
            [[point["x"], point["y"], point["z"]] for point in landmarks],
            dtype=np.float32,
        ).flatten()

        return {
            "features": features,
            "landmarks": landmarks,
            "handedness": extracted["handedness"],
            "hand_confidence": extracted["hand_confidence"],
            "bbox": bbox_from_landmarks(landmarks, image_bgr.shape[1], image_bgr.shape[0]),
        }

    def predict(self, image_bgr: np.ndarray) -> dict[str, Any]:
        extracted = self.extract_landmarks(image_bgr)
        if extracted is None:
            return response("no_hand", "No hand detected", model_name=self.name)

        prediction = self.model.predict(
            np.array([extracted["features"]], dtype=np.float32), verbose=0
        )[0]
        class_id = int(np.argmax(prediction))
        confidence = float(prediction[class_id])
        gesture = self.labels[class_id] if class_id < len(self.labels) else f"Gesture_{class_id}"
        top_indices = np.argsort(prediction)[-5:][::-1]
        top_predictions = [
            {
                "class_id": int(index),
                "gesture": self.labels[int(index)]
                if int(index) < len(self.labels)
                else f"Gesture_{int(index)}",
                "confidence": float(prediction[int(index)]),
            }
            for index in top_indices
        ]

        return response(
            "success",
            gesture,
            confidence=confidence,
            class_id=class_id,
            landmarks=[extracted["landmarks"]],
            handedness=[extracted["handedness"]],
            confidence_scores=[extracted["hand_confidence"]],
            top_predictions=top_predictions,
            bbox=extracted["bbox"],
            model_name=self.name,
        )


app = FastAPI(
    title="Legacy Sign-to-Text Recognition API",
    description="Realtime sign recognition using legacy Sign-to-Text-Convertor",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model: Optional[LegacySignToTextModel] = None


@app.on_event("startup")
def startup_event() -> None:
    global model

    source_dir = legacy_dir()
    model = LegacySignToTextModel(
        source_dir / "gesture_model.h5",
        source_dir / "gesture_mapping.json",
    )


@app.get("/health")
def health_check() -> dict[str, Any]:
    return {
        "status": "healthy" if model is not None else "unhealthy",
        "backend": "legacy-sign-to-text",
        "model_loaded": model is not None,
        "model": model.name if model else "none",
        "model_path": str(model.model_path) if model else "",
        "labels_path": str(model.labels_path) if model else "",
        "num_gestures": len(model.labels) if model else 0,
        "tensorflow_available": load_model is not None,
        "mediapipe_available": mp is not None,
        "mediapipe_backend": model.extractor.backend if model else "",
        "timestamp": str(datetime.now()),
    }


@app.post("/api/predict")
async def predict(file: UploadFile = File(...)) -> dict[str, Any]:
    if model is None:
        raise HTTPException(status_code=503, detail="Legacy Sign-to-Text model is not initialized")

    try:
        image_bgr = image_bytes_to_bgr(await file.read())
        return model.predict(image_bgr)
    except Exception as exc:
        logger.error("Prediction error: %s", exc, exc_info=True)
        return response("error", f"Prediction failed: {exc}")


@app.post("/api/predict-base64")
async def predict_base64(data: dict[str, Any]) -> dict[str, Any]:
    if model is None:
        raise HTTPException(status_code=503, detail="Legacy Sign-to-Text model is not initialized")

    try:
        base64_str = data.get("image")
        if not base64_str:
            raise ValueError("No image provided")
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]

        image_bgr = image_bytes_to_bgr(base64.b64decode(base64_str))
        return model.predict(image_bgr)
    except Exception as exc:
        logger.error("Base64 prediction error: %s", exc, exc_info=True)
        return response("error", f"Prediction failed: {exc}")


@app.post("/api/batch-predict")
async def batch_predict(files: list[UploadFile] = File(...)) -> dict[str, Any]:
    if model is None:
        raise HTTPException(status_code=503, detail="Legacy Sign-to-Text model is not initialized")

    results = []
    for file in files:
        try:
            prediction = model.predict(image_bytes_to_bgr(await file.read()))
            prediction["file"] = file.filename
            results.append(prediction)
        except Exception as exc:
            results.append({"file": file.filename, "error": str(exc)})

    return {"results": results}


@app.get("/api/gestures")
def list_gestures() -> dict[str, Any]:
    if model is None:
        raise HTTPException(status_code=503, detail="Legacy Sign-to-Text model is not initialized")

    return {
        "gestures": model.labels,
        "count": len(model.labels),
        "model": model.name,
    }


@app.get("/api/info")
def get_info() -> dict[str, Any]:
    return {
        "name": "Legacy Sign-to-Text Recognition API",
        "version": "3.0.0",
        "backend": "legacy-sign-to-text",
        "model_loaded": model is not None,
        "model": model.name if model else "none",
        "num_gestures": len(model.labels) if model else 0,
        "supported_formats": ["image/jpeg", "image/png"],
        "endpoints": [
            "/health",
            "/api/predict",
            "/api/predict-base64",
            "/api/batch-predict",
            "/api/gestures",
            "/api/info",
        ],
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

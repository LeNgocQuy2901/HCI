"""
FastAPI inference server for sign language recognition.

Primary backend:
  - Bidirectional-Sign-Language-Converter Keras model
  - MediaPipe Hands landmark extraction

Fallback backend:
  - Existing DeGirum/ONNX image classifier when the landmark model dependencies
    or files are not available.
"""

import base64
import io
import json
import logging
import random
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
    from tensorflow.keras.models import load_model as load_keras_model
except Exception:
    load_keras_model = None

try:
    import onnxruntime
except Exception:
    onnxruntime = None

try:
    import torch
except Exception:
    torch = None

import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def softmax(values: np.ndarray) -> np.ndarray:
    values = values.astype(np.float32)
    exp_values = np.exp(values - np.max(values))
    return exp_values / np.sum(exp_values)


def load_label_file(labels_path: Path, fallback_count: int) -> list[str]:
    try:
        with labels_path.open("r", encoding="utf-8") as file:
            data = json.load(file)
            if isinstance(data, dict):
                return [data[str(index)] for index in range(len(data))]
            if isinstance(data, list):
                return [str(item) for item in data]
    except Exception as exc:
        logger.warning("Could not load labels from %s: %s", labels_path, exc)

    return [f"Gesture_{index}" for index in range(fallback_count)]


def image_bytes_to_bgr(contents: bytes) -> np.ndarray:
    image_pil = Image.open(io.BytesIO(contents)).convert("RGB")
    image_np = np.array(image_pil)
    return cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)


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


class BidirectionalLandmarkModel:
    """Gesture classifier from Bidirectional-Sign-Language-Converter."""

    name = "Bidirectional Landmark Keras"

    def __init__(self, model_path: Path, labels_path: Path):
        if load_keras_model is None:
            raise RuntimeError("tensorflow is not installed")
        if not model_path.exists():
            raise FileNotFoundError(model_path)

        self.model_path = model_path
        self.labels_path = labels_path
        self.labels = load_label_file(labels_path, fallback_count=25)
        self.model = load_keras_model(str(model_path))
        self.hands = None
        if mp is not None and hasattr(mp, "solutions"):
            self.hands = mp.solutions.hands.Hands(
                static_image_mode=True,
                max_num_hands=1,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5,
            )
        logger.info(
            "Loaded %s model from %s with %d gestures",
            self.name,
            model_path,
            len(self.labels),
        )

    def _extract_landmarks(self, image_bgr: np.ndarray) -> Optional[dict[str, Any]]:
        if self.hands is None:
            raise RuntimeError(
                "Server-side MediaPipe Hands is unavailable. Use /api/predict-landmarks."
            )

        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        results = self.hands.process(image_rgb)

        if not results.multi_hand_landmarks:
            return None

        hand_landmarks = results.multi_hand_landmarks[0]
        landmarks = [
            {"x": point.x, "y": point.y, "z": point.z}
            for point in hand_landmarks.landmark
        ]
        handedness = "Unknown"
        hand_confidence = 0.0

        if results.multi_handedness:
            classification = results.multi_handedness[0].classification[0]
            handedness = classification.label
            hand_confidence = float(classification.score)

        return {
            "features": np.array(
                [[point["x"], point["y"], point["z"]] for point in landmarks],
                dtype=np.float32,
            ).flatten(),
            "landmarks": landmarks,
            "handedness": handedness,
            "hand_confidence": hand_confidence,
            "bbox": bbox_from_landmarks(
                landmarks, image_bgr.shape[1], image_bgr.shape[0]
            ),
        }

    def predict_landmarks(
        self,
        landmarks: list[list[dict[str, float]]] | list[dict[str, float]],
        handedness: Optional[list[str]] = None,
        confidence_scores: Optional[list[float]] = None,
    ) -> dict[str, Any]:
        if landmarks and isinstance(landmarks[0], dict):
            hand_landmarks = landmarks
            normalized_landmarks = [landmarks]
        else:
            hand_landmarks = landmarks[0] if landmarks else []
            normalized_landmarks = landmarks

        if len(hand_landmarks) != 21:
            return {
                "status": "no_hand",
                "gesture": "No hand detected",
                "confidence": 0.0,
                "class_id": -1,
                "landmarks": [],
                "handedness": [],
                "confidence_scores": [],
                "bbox": None,
                "model": self.name,
            }

        features = np.array(
            [[point["x"], point["y"], point["z"]] for point in hand_landmarks],
            dtype=np.float32,
        ).flatten()
        predictions = self.model.predict(np.array([features]), verbose=0)[0]
        class_id = int(np.argmax(predictions))
        confidence = float(predictions[class_id])

        return {
            "status": "success",
            "gesture": self.labels[class_id]
            if class_id < len(self.labels)
            else f"Gesture_{class_id}",
            "confidence": confidence,
            "class_id": class_id,
            "landmarks": normalized_landmarks,
            "handedness": handedness or ["Unknown"],
            "confidence_scores": confidence_scores or [],
            "bbox": None,
            "model": self.name,
        }

    def predict(self, image_bgr: np.ndarray) -> dict[str, Any]:
        extracted = self._extract_landmarks(image_bgr)
        if extracted is None:
            return {
                "status": "no_hand",
                "gesture": "No hand detected",
                "confidence": 0.0,
                "class_id": -1,
                "landmarks": [],
                "handedness": [],
                "confidence_scores": [],
                "bbox": None,
                "model": self.name,
            }

        predictions = self.model.predict(
            np.array([extracted["features"]], dtype=np.float32), verbose=0
        )[0]
        class_id = int(np.argmax(predictions))
        confidence = float(predictions[class_id])

        return {
            "status": "success",
            "gesture": self.labels[class_id]
            if class_id < len(self.labels)
            else f"Gesture_{class_id}",
            "confidence": confidence,
            "class_id": class_id,
            "landmarks": [extracted["landmarks"]],
            "handedness": [extracted["handedness"]],
            "confidence_scores": [extracted["hand_confidence"]],
            "bbox": extracted["bbox"],
            "model": self.name,
        }


class LegacyImageModel:
    """Existing image classifier retained as a fallback."""

    name = "Legacy Image Classifier"

    def __init__(self, model_path: Path, labels_path: Path):
        self.model_path = model_path
        self.labels_path = labels_path
        self.labels = load_label_file(labels_path, fallback_count=29)
        self.model = None
        self.use_onnx = False
        self.device = (
            "cuda" if torch is not None and torch.cuda.is_available() else "cpu"
        )
        self.load_model()

    def load_model(self) -> None:
        if self.model_path.exists() and onnxruntime is not None:
            try:
                self.model = onnxruntime.InferenceSession(
                    str(self.model_path),
                    providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
                )
                self.use_onnx = True
                logger.info("Loaded legacy ONNX model from %s", self.model_path)
                return
            except Exception as exc:
                logger.warning("Legacy ONNX loading failed: %s", exc)

        logger.warning("Legacy model unavailable, using demo predictions")
        self.model = None

    def preprocess(self, image_bgr: np.ndarray) -> np.ndarray:
        image = cv2.resize(image_bgr, (224, 224))
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image = image.astype(np.float32) / 255.0
        image = np.transpose(image, (2, 0, 1))
        return np.expand_dims(image, axis=0)

    def predict(self, image_bgr: np.ndarray) -> dict[str, Any]:
        if self.model is None:
            class_id = random.randint(0, max(len(self.labels) - 1, 0))
            confidence = random.uniform(0.5, 0.7)
            return {
                "status": "demo",
                "gesture": self.labels[class_id],
                "confidence": confidence,
                "class_id": class_id,
                "landmarks": [],
                "handedness": [],
                "confidence_scores": [],
                "bbox": None,
                "model": self.name,
            }

        image = self.preprocess(image_bgr)
        input_name = self.model.get_inputs()[0].name
        output_name = self.model.get_outputs()[0].name
        logits = self.model.run([output_name], {input_name: image})[0][0]
        scores = softmax(logits)
        class_id = int(np.argmax(scores))

        return {
            "status": "success",
            "gesture": self.labels[class_id]
            if class_id < len(self.labels)
            else f"Gesture_{class_id}",
            "confidence": float(scores[class_id]),
            "class_id": class_id,
            "landmarks": [],
            "handedness": [],
            "confidence_scores": [],
            "bbox": None,
            "model": self.name,
        }


app = FastAPI(
    title="Sign Language Recognition API",
    description="Real-time gesture prediction with landmark and image backends",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model: Optional[BidirectionalLandmarkModel | LegacyImageModel] = None


def load_model_on_startup() -> None:
    global model

    model_dir = Path(__file__).parent.parent / "model"
    bidirectional_model_path = model_dir / "gesture_model.h5"
    bidirectional_labels_path = model_dir / "gesture_mapping_bidirectional.json"
    legacy_model_path = model_dir / "mobilenet_v2_sign_language_224x224_float_n2x_cpu_1.n2x"
    legacy_labels_path = model_dir / "labels_sign_language.json"

    try:
        model = BidirectionalLandmarkModel(
            bidirectional_model_path, bidirectional_labels_path
        )
        return
    except Exception as exc:
        logger.warning("Bidirectional landmark model unavailable: %s", exc)

    model = LegacyImageModel(legacy_model_path, legacy_labels_path)


@app.on_event("startup")
def startup_event() -> None:
    load_model_on_startup()


@app.get("/health")
def health_check() -> dict[str, Any]:
    return {
        "status": "healthy",
        "model_loaded": model is not None and getattr(model, "model", None) is not None,
        "model": model.name if model else "none",
        "backend": "landmarks"
        if isinstance(model, BidirectionalLandmarkModel)
        else "image",
        "num_gestures": len(model.labels) if model else 0,
        "tensorflow_available": load_keras_model is not None,
        "mediapipe_available": mp is not None,
        "timestamp": str(datetime.now()),
    }


@app.post("/api/predict")
async def predict(file: UploadFile = File(...)) -> dict[str, Any]:
    if model is None:
        raise HTTPException(status_code=503, detail="Model not initialized")

    try:
        contents = await file.read()
        image_bgr = image_bytes_to_bgr(contents)
        result = model.predict(image_bgr)
        result["timestamp"] = str(datetime.now())
        return result
    except Exception as exc:
        logger.error("Prediction error: %s", exc, exc_info=True)
        raise HTTPException(status_code=400, detail=f"Prediction failed: {exc}")


@app.post("/api/predict-landmarks")
async def predict_landmarks(data: dict[str, Any]) -> dict[str, Any]:
    if model is None:
        raise HTTPException(status_code=503, detail="Model not initialized")
    if not isinstance(model, BidirectionalLandmarkModel):
        raise HTTPException(
            status_code=503,
            detail="Landmark classifier is not available; check TensorFlow/model files",
        )

    try:
        result = model.predict_landmarks(
            landmarks=data.get("landmarks") or [],
            handedness=data.get("handedness"),
            confidence_scores=data.get("confidence"),
        )
        result["timestamp"] = str(datetime.now())
        return result
    except Exception as exc:
        logger.error("Landmark prediction error: %s", exc, exc_info=True)
        raise HTTPException(status_code=400, detail=f"Prediction failed: {exc}")


@app.post("/api/predict-base64")
async def predict_base64(data: dict[str, Any]) -> dict[str, Any]:
    if model is None:
        raise HTTPException(status_code=503, detail="Model not initialized")

    try:
        base64_str = data.get("image")
        if not base64_str:
            raise ValueError("No image provided")
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]

        image_bgr = image_bytes_to_bgr(base64.b64decode(base64_str))
        result = model.predict(image_bgr)
        result["timestamp"] = str(datetime.now())
        return result
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/batch-predict")
async def batch_predict(files: list[UploadFile] = File(...)) -> dict[str, Any]:
    if model is None:
        raise HTTPException(status_code=503, detail="Model not initialized")

    results = []
    for file in files:
        try:
            image_bgr = image_bytes_to_bgr(await file.read())
            prediction = model.predict(image_bgr)
            prediction["file"] = file.filename
            results.append(prediction)
        except Exception as exc:
            results.append({"file": file.filename, "error": str(exc)})

    return {"results": results}


@app.get("/api/gestures")
def list_gestures() -> dict[str, Any]:
    if model is None:
        raise HTTPException(status_code=503, detail="Model not initialized")

    return {
        "gestures": model.labels,
        "count": len(model.labels),
        "model": model.name,
    }


@app.get("/api/info")
def get_info() -> dict[str, Any]:
    return {
        "name": "Sign Language Recognition API",
        "version": "2.0.0",
        "model_loaded": model is not None and getattr(model, "model", None) is not None,
        "model": model.name if model else "none",
        "num_gestures": len(model.labels) if model else 0,
        "supported_formats": ["image/jpeg", "image/png"],
        "endpoints": [
            "/health",
            "/api/predict",
            "/api/predict-landmarks",
            "/api/predict-base64",
            "/api/batch-predict",
            "/api/gestures",
            "/api/info",
        ],
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

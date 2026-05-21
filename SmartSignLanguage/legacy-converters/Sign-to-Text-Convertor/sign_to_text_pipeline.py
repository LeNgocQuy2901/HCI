"""
Bidirectional Sign-to-Text converter runtime.

This module turns the original notebook flow into reusable project code:
OpenCV image -> MediaPipe hand landmarks -> 63-value feature vector ->
Keras gesture classifier.
"""

from __future__ import annotations

import io
import json
import logging
import os
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import cv2
import numpy as np
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

logger = logging.getLogger(__name__)

HAND_LANDMARKER_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/1/hand_landmarker.task"
)

TENSORFLOW_AVAILABLE = load_model is not None
MEDIAPIPE_AVAILABLE = mp is not None
DEFAULT_CONFIDENCE_TEMPERATURE = 0.35


def image_bytes_to_bgr(contents: bytes) -> np.ndarray:
    if not contents:
        raise ValueError("No image bytes provided")

    image = Image.open(io.BytesIO(contents)).convert("RGB")
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)


def load_label_mapping(labels_path: Path) -> list[str]:
    with labels_path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if isinstance(data, dict):
        return [str(data[str(index)]) for index in range(len(data))]
    if isinstance(data, list):
        return [str(label) for label in data]

    raise ValueError(f"Unsupported label mapping format: {labels_path}")


def load_training_metadata(metadata_path: Path) -> dict[str, Any]:
    if not metadata_path.exists():
        raise FileNotFoundError(metadata_path)

    with metadata_path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, dict):
        raise ValueError(f"Unsupported training metadata format: {metadata_path}")

    return data


def summarize_training_metadata(metadata: dict[str, Any]) -> dict[str, Any]:
    config = metadata.get("config") if isinstance(metadata.get("config"), dict) else {}
    classes = metadata.get("classes") if isinstance(metadata.get("classes"), list) else []

    return {
        "num_samples": metadata.get("num_samples"),
        "num_classes": metadata.get("num_classes") or len(classes),
        "dataset_dir": config.get("dataset_dir"),
        "feature_mode": config.get("feature_mode"),
        "frames_per_video": config.get("frames_per_video"),
        "epochs": config.get("epochs"),
        "batch_size": config.get("batch_size"),
        "min_detection_confidence": config.get("min_detection_confidence"),
    }


def confidence_temperature_from_env() -> float:
    raw_value = os.environ.get("SIGN_CONFIDENCE_TEMPERATURE", "").strip()
    if not raw_value:
        return DEFAULT_CONFIDENCE_TEMPERATURE

    try:
        value = float(raw_value)
    except ValueError:
        logger.warning("Invalid SIGN_CONFIDENCE_TEMPERATURE=%s, using default", raw_value)
        return DEFAULT_CONFIDENCE_TEMPERATURE

    return min(max(value, 0.05), 2.0)


def calibrate_probabilities(
    probabilities: np.ndarray, temperature: float
) -> np.ndarray:
    clipped = np.clip(probabilities.astype(np.float64), 1e-12, 1.0)
    sharpened = np.power(clipped, 1.0 / temperature)
    total = np.sum(sharpened)
    if not np.isfinite(total) or total <= 0:
        return probabilities.astype(np.float64)

    return sharpened / total


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
    training_metadata: Optional[dict[str, Any]] = None,
    raw_confidence: Optional[float] = None,
    confidence_temperature: Optional[float] = None,
    bbox: Optional[list[int]] = None,
    model_name: str = "Bidirectional Sign-to-Text Keras",
) -> dict[str, Any]:
    return {
        "status": status,
        "gesture": gesture,
        "confidence": confidence,
        "raw_confidence": raw_confidence if raw_confidence is not None else confidence,
        "confidence_temperature": confidence_temperature,
        "class_id": class_id,
        "landmarks": landmarks or [],
        "handedness": handedness or [],
        "confidence_scores": confidence_scores or [],
        "top_predictions": top_predictions or [],
        "training_metadata": training_metadata or {},
        "bbox": bbox,
        "model": model_name,
        "timestamp": str(datetime.now()),
    }


class HandLandmarkExtractor:
    def __init__(
        self,
        task_path: Path,
        min_detection_confidence: float = 0.25,
        min_tracking_confidence: float = 0.25,
    ):
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
                min_detection_confidence=min_detection_confidence,
                min_tracking_confidence=min_tracking_confidence,
            )
            return

        if mp_tasks_python is None or mp_tasks_vision is None:
            raise RuntimeError(
                "mediapipe is installed, but neither mp.solutions nor mediapipe.tasks is available"
            )

        self.backend = "mediapipe-tasks"
        task_path = ensure_hand_landmarker_task(task_path)
        options = mp_tasks_vision.HandLandmarkerOptions(
            base_options=mp_tasks_python.BaseOptions(model_asset_path=str(task_path)),
            running_mode=mp_tasks_vision.RunningMode.IMAGE,
            num_hands=1,
            min_hand_detection_confidence=min_detection_confidence,
            min_hand_presence_confidence=min_tracking_confidence,
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


def ensure_hand_landmarker_task(path: Path) -> Path:
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


class BidirectionalSignToTextModel:
    name = "Bidirectional Sign-to-Text Keras"

    def __init__(
        self,
        model_path: Path,
        labels_path: Path,
        metadata_path: Path,
        hand_landmarker_task_path: Path,
    ):
        if load_model is None:
            raise RuntimeError("tensorflow is not installed")
        if not model_path.exists():
            raise FileNotFoundError(model_path)
        if not labels_path.exists():
            raise FileNotFoundError(labels_path)

        self.model_path = model_path
        self.labels_path = labels_path
        self.metadata_path = metadata_path
        self.labels = load_label_mapping(labels_path)
        self.training_metadata = load_training_metadata(metadata_path)
        self.training_summary = summarize_training_metadata(self.training_metadata)
        self.confidence_temperature = confidence_temperature_from_env()
        self.model = load_model(str(model_path))
        self.validate_assets()
        self.extractor = HandLandmarkExtractor(hand_landmarker_task_path)

        logger.info(
            "Loaded %s from %s with %d labels, metadata %s, confidence temperature %.2f, using %s",
            self.name,
            self.model_path,
            len(self.labels),
            self.metadata_path,
            self.confidence_temperature,
            self.extractor.backend,
        )

    def validate_assets(self) -> None:
        metadata_classes = self.training_metadata.get("classes")
        metadata_num_classes = self.training_metadata.get("num_classes")

        if isinstance(metadata_num_classes, int) and metadata_num_classes != len(self.labels):
            raise ValueError(
                "training_metadata.json num_classes does not match gesture_mapping.json: "
                f"{metadata_num_classes} != {len(self.labels)}"
            )

        if isinstance(metadata_classes, list):
            metadata_labels = [str(label) for label in metadata_classes]
            if metadata_labels != self.labels:
                raise ValueError(
                    "training_metadata.json classes do not match gesture_mapping.json labels"
                )

        output_shape = getattr(self.model, "output_shape", None)
        if isinstance(output_shape, tuple) and output_shape:
            output_classes = output_shape[-1]
            if isinstance(output_classes, int) and output_classes != len(self.labels):
                raise ValueError(
                    "gesture_model.h5 output classes do not match gesture_mapping.json: "
                    f"{output_classes} != {len(self.labels)}"
                )

    def metadata_summary(self) -> dict[str, Any]:
        return {
            **self.training_summary,
            "metadata_path": str(self.metadata_path),
            "confidence_temperature": self.confidence_temperature,
        }

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
            return response(
                "no_hand",
                "No hand detected",
                model_name=self.name,
                training_metadata=self.metadata_summary(),
            )

        raw_prediction = self.model.predict(
            np.array([extracted["features"]], dtype=np.float32), verbose=0
        )[0]
        prediction = calibrate_probabilities(raw_prediction, self.confidence_temperature)
        class_id = int(np.argmax(raw_prediction))
        raw_confidence = float(raw_prediction[class_id])
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
                "raw_confidence": float(raw_prediction[int(index)]),
            }
            for index in top_indices
        ]

        return response(
            "success",
            gesture,
            confidence=confidence,
            raw_confidence=raw_confidence,
            confidence_temperature=self.confidence_temperature,
            class_id=class_id,
            landmarks=[extracted["landmarks"]],
            handedness=[extracted["handedness"]],
            confidence_scores=[extracted["hand_confidence"]],
            top_predictions=top_predictions,
            training_metadata=self.metadata_summary(),
            bbox=extracted["bbox"],
            model_name=self.name,
        )

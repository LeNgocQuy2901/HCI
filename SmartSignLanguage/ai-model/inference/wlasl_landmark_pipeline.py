from __future__ import annotations

import io
import json
import logging
from collections import deque
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import cv2
import numpy as np
from PIL import Image

try:
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision
except Exception:
    mp = None
    mp_python = None
    mp_vision = None

try:
    from tensorflow.keras.models import load_model
except Exception:
    load_model = None

logger = logging.getLogger(__name__)

SEQ_LEN = 20
FEATURE_DIM = 225
DEFAULT_CONFIDENCE_THRESHOLD = 0.0

TENSORFLOW_AVAILABLE = load_model is not None
MEDIAPIPE_AVAILABLE = mp is not None and mp_python is not None and mp_vision is not None


def image_bytes_to_bgr(contents: bytes) -> np.ndarray:
    if not contents:
        raise ValueError("No image bytes provided")

    image = Image.open(io.BytesIO(contents)).convert("RGB")
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)


def load_mapping(mapping_path: Path) -> tuple[list[str], dict[str, Any]]:
    with mapping_path.open("r", encoding="utf-8") as file:
        mapping = json.load(file)

    index_to_word = mapping.get("index_to_word")
    if isinstance(index_to_word, dict):
        labels = [str(index_to_word[str(index)]) for index in range(len(index_to_word))]
    elif isinstance(mapping.get("selected_words"), list):
        labels = [str(label) for label in mapping["selected_words"]]
    else:
        raise ValueError(f"Unsupported mapping format: {mapping_path}")

    return labels, mapping


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
    model_name: str = "WLASL 10-word Landmark Keras",
    frames_ready: int = 0,
    frames_required: int = SEQ_LEN,
) -> dict[str, Any]:
    return {
        "status": status,
        "gesture": gesture,
        "confidence": confidence,
        "raw_confidence": confidence,
        "confidence_temperature": None,
        "class_id": class_id,
        "landmarks": landmarks or [],
        "handedness": handedness or [],
        "confidence_scores": confidence_scores or [],
        "top_predictions": top_predictions or [],
        "training_metadata": {
            "feature_mode": "hands_pose_landmarks",
            "frames_per_video": frames_required,
            "frames_ready": frames_ready,
        },
        "bbox": bbox,
        "model": model_name,
        "timestamp": str(datetime.now()),
    }


def bbox_from_landmark_groups(
    landmark_groups: list[list[dict[str, float]]], image_width: int, image_height: int
) -> Optional[list[int]]:
    points = [point for group in landmark_groups for point in group]
    if not points:
        return None

    padding = 0.05
    x1 = max(0, int((min(point["x"] for point in points) - padding) * image_width))
    y1 = max(0, int((min(point["y"] for point in points) - padding) * image_height))
    x2 = min(image_width, int((max(point["x"] for point in points) + padding) * image_width))
    y2 = min(image_height, int((max(point["y"] for point in points) + padding) * image_height))
    return [x1, y1, x2, y2]


def normalize_sequence(seq: np.ndarray) -> np.ndarray:
    seq = seq.copy()
    for frame_index in range(seq.shape[0]):
        left_hand = seq[frame_index, 0:63].reshape(21, 3)
        if np.any(left_hand != 0):
            left_hand = left_hand - left_hand[0]
            scale = np.max(np.linalg.norm(left_hand, axis=1)) + 1e-8
            seq[frame_index, 0:63] = (left_hand / scale).flatten()

        right_hand = seq[frame_index, 63:126].reshape(21, 3)
        if np.any(right_hand != 0):
            right_hand = right_hand - right_hand[0]
            scale = np.max(np.linalg.norm(right_hand, axis=1)) + 1e-8
            seq[frame_index, 63:126] = (right_hand / scale).flatten()

        pose = seq[frame_index, 126:225].reshape(33, 3)
        if np.any(pose != 0):
            pose = pose - pose[0]
            shoulder_width = np.linalg.norm(pose[11] - pose[12]) + 1e-8
            seq[frame_index, 126:225] = (pose / shoulder_width).flatten()

    return seq.astype(np.float32)


class HolisticLandmarkExtractor:
    def __init__(self, hand_task_path: Path, pose_task_path: Path):
        if not MEDIAPIPE_AVAILABLE:
            raise RuntimeError("mediapipe tasks is not installed")
        if not hand_task_path.exists():
            raise FileNotFoundError(hand_task_path)
        if not pose_task_path.exists():
            raise FileNotFoundError(pose_task_path)

        self.hand_task_path = hand_task_path
        self.pose_task_path = pose_task_path
        self.backend = "mediapipe-tasks-hands-pose"

        self.hand_detector = mp_vision.HandLandmarker.create_from_options(
            mp_vision.HandLandmarkerOptions(
                base_options=mp_python.BaseOptions(model_asset_path=str(hand_task_path)),
                num_hands=2,
                min_hand_detection_confidence=0.3,
                min_hand_presence_confidence=0.3,
                min_tracking_confidence=0.3,
                running_mode=mp_vision.RunningMode.IMAGE,
            )
        )
        self.pose_detector = mp_vision.PoseLandmarker.create_from_options(
            mp_vision.PoseLandmarkerOptions(
                base_options=mp_python.BaseOptions(model_asset_path=str(pose_task_path)),
                min_pose_detection_confidence=0.3,
                min_tracking_confidence=0.3,
                running_mode=mp_vision.RunningMode.IMAGE,
            )
        )

    def process(self, image_bgr: np.ndarray) -> dict[str, Any]:
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)

        left_hand = np.zeros(63, dtype=np.float32)
        right_hand = np.zeros(63, dtype=np.float32)
        left_hand_set = False
        right_hand_set = False
        display_landmarks: list[list[dict[str, float]]] = []
        handedness: list[str] = []
        hand_scores: list[float] = []

        hand_result = self.hand_detector.detect(mp_image)
        for index, hand_categories in enumerate(hand_result.handedness):
            if index >= len(hand_result.hand_landmarks):
                continue

            category = hand_categories[0]
            hand_label = category.category_name
            hand_points = hand_result.hand_landmarks[index]
            flat_points = np.array(
                [[landmark.x, landmark.y, landmark.z] for landmark in hand_points],
                dtype=np.float32,
            ).flatten()

            if hand_label == "Left":
                left_hand = flat_points
                left_hand_set = True
            else:
                right_hand = flat_points
                right_hand_set = True

            display_landmarks.append(
                [
                    {"x": landmark.x, "y": landmark.y, "z": landmark.z}
                    for landmark in hand_points
                ]
            )
            handedness.append(hand_label)
            hand_scores.append(float(category.score))

        pose = np.zeros(99, dtype=np.float32)
        pose_result = self.pose_detector.detect(mp_image)
        if pose_result.pose_landmarks:
            pose = np.array(
                [[landmark.x, landmark.y, landmark.z] for landmark in pose_result.pose_landmarks[0]],
                dtype=np.float32,
            ).flatten()

        features = np.concatenate([left_hand, right_hand, pose]).astype(np.float32)
        return {
            "features": features,
            "landmarks": display_landmarks,
            "handedness": handedness,
            "hand_scores": hand_scores,
            "bbox": bbox_from_landmark_groups(
                display_landmarks, image_bgr.shape[1], image_bgr.shape[0]
            ),
            "has_hand": bool(display_landmarks),
        }


class WlaslLandmarkSequenceModel:
    name = "WLASL 8-source 10-word Landmark Keras"

    def __init__(
        self,
        model_path: Path,
        mapping_path: Path,
        hand_task_path: Path,
        pose_task_path: Path,
        sequence_length: int = SEQ_LEN,
    ):
        if load_model is None:
            raise RuntimeError("tensorflow is not installed")
        if not model_path.exists():
            raise FileNotFoundError(model_path)
        if not mapping_path.exists():
            raise FileNotFoundError(mapping_path)

        self.model_path = model_path
        self.labels_path = mapping_path
        self.mapping_path = mapping_path
        self.hand_task_path = hand_task_path
        self.pose_task_path = pose_task_path
        self.sequence_length = sequence_length
        self.labels, self.mapping = load_mapping(mapping_path)
        self.model = load_model(str(model_path), compile=False)
        self.extractor = HolisticLandmarkExtractor(hand_task_path, pose_task_path)
        self.sequence: deque[np.ndarray] = deque(maxlen=sequence_length)

        output_shape = getattr(self.model, "output_shape", None)
        if isinstance(output_shape, tuple) and output_shape[-1] != len(self.labels):
            raise ValueError(
                f"Model output classes ({output_shape[-1]}) do not match mapping labels ({len(self.labels)})"
            )

        logger.info(
            "Loaded %s from %s with %d labels using %s",
            self.name,
            self.model_path,
            len(self.labels),
            self.extractor.backend,
        )

    @property
    def model_name(self) -> str:
        return self.name

    def reset(self) -> None:
        self.sequence.clear()

    def metadata_summary(self) -> dict[str, Any]:
        return {
            "num_classes": len(self.labels),
            "classes": self.labels,
            "seq_len": self.sequence_length,
            "feature_dim": FEATURE_DIM,
            "normalized": bool(self.mapping.get("normalized", True)),
            "architecture": self.mapping.get("architecture", "wlasl_landmarks"),
            "model_path": str(self.model_path),
            "mapping_path": str(self.mapping_path),
            "hand_task_path": str(self.hand_task_path),
            "pose_task_path": str(self.pose_task_path),
            "frames_ready": len(self.sequence),
        }

    def predict(self, image_bgr: np.ndarray) -> dict[str, Any]:
        extracted = self.extractor.process(image_bgr)
        if not extracted["has_hand"]:
            return response(
                "no_hand",
                "No hand detected",
                model_name=self.name,
                frames_ready=len(self.sequence),
                frames_required=self.sequence_length,
            )

        self.sequence.append(extracted["features"])
        frames_ready = len(self.sequence)
        if frames_ready < self.sequence_length:
            return response(
                "warming_up",
                "Collecting frames",
                landmarks=extracted["landmarks"],
                handedness=extracted["handedness"],
                confidence_scores=extracted["hand_scores"],
                bbox=extracted["bbox"],
                model_name=self.name,
                frames_ready=frames_ready,
                frames_required=self.sequence_length,
            )

        sequence = normalize_sequence(np.array(self.sequence, dtype=np.float32))
        raw_prediction = self.model.predict(np.array([sequence], dtype=np.float32), verbose=0)[0]
        class_id = int(np.argmax(raw_prediction))
        confidence = float(raw_prediction[class_id])
        gesture = self.labels[class_id] if class_id < len(self.labels) else f"Gesture_{class_id}"

        top_indices = np.argsort(raw_prediction)[-5:][::-1]
        top_predictions = [
            {
                "class_id": int(index),
                "gesture": self.labels[int(index)]
                if int(index) < len(self.labels)
                else f"Gesture_{int(index)}",
                "confidence": float(raw_prediction[int(index)]),
                "raw_confidence": float(raw_prediction[int(index)]),
            }
            for index in top_indices
        ]

        return response(
            "success",
            gesture,
            confidence=confidence,
            class_id=class_id,
            landmarks=extracted["landmarks"],
            handedness=extracted["handedness"],
            confidence_scores=extracted["hand_scores"],
            top_predictions=top_predictions,
            bbox=extracted["bbox"],
            model_name=self.name,
            frames_ready=frames_ready,
            frames_required=self.sequence_length,
        )

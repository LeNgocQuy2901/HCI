"""
ASL CNN Pipeline - Nhận dạng chữ cái ASL (A-Z) từ ảnh tĩnh.

Model: ASL_detector_CNN.h5
Input: 1 ảnh (64x64 RGB) sau khi crop vùng bàn tay bằng MediaPipe
Output: chữ cái A-Z, hoặc "space" / "del" / "nothing"

Đặt file này tại: ai-model/inference/asl_cnn_pipeline.py
"""

from __future__ import annotations
import time
import io
import logging
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
    MEDIAPIPE_AVAILABLE = True
except Exception:
    mp = None
    MEDIAPIPE_AVAILABLE = False

try:
    from tensorflow.keras.models import load_model
    TENSORFLOW_AVAILABLE = True
except Exception:
    load_model = None
    TENSORFLOW_AVAILABLE = False

logger = logging.getLogger(__name__)

# Nhãn theo thứ tự output của model Kaggle (a-z + space + del + nothing)
# Model Hazem Alaa train theo thứ tự alphabet chuẩn của dataset ASL
DEFAULT_LABELS = [
    "A","B","C","D","E","F","G","H","I","J","K","L","M",
    "N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
    "del","nothing","space"
]

IMG_SIZE = 64  # default, sẽ được ghi đè bằng input shape thực của model khi load


def image_bytes_to_bgr(contents: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)


def response(
    status: str,
    gesture: str,
    confidence: float = 0.0,
    class_id: int = -1,
    top_predictions: Optional[list[dict]] = None,
    bbox: Optional[list[int]] = None,
) -> dict[str, Any]:
    return {
        "status": status,
        "gesture": gesture,
        "confidence": confidence,
        "class_id": class_id,
        "top_predictions": top_predictions or [],
        "bbox": bbox,
        "model": "ASL_CNN_Kaggle",
        "timestamp": str(datetime.now()),
    }


class HandCropper:
    """
    Dùng MediaPipe để detect và crop vùng bàn tay từ frame.
    Nếu không detect được tay → trả về ảnh gốc resize.
    """

    def __init__(self, hand_task_path: Optional[Path] = None):
        self.detector = None

        if not MEDIAPIPE_AVAILABLE:
            logger.warning("MediaPipe không có — sẽ dùng ảnh gốc không crop")
            return

        try:
            # Ưu tiên dùng Tasks API nếu có file .task
            if hand_task_path and hand_task_path.exists():
                self.detector = mp_vision.HandLandmarker.create_from_options(
                    mp_vision.HandLandmarkerOptions(
                        base_options=mp_python.BaseOptions(
                            model_asset_path=str(hand_task_path)
                        ),
                        num_hands=1,
                        min_hand_detection_confidence=0.3,
                        min_hand_presence_confidence=0.3,
                        running_mode=mp_vision.RunningMode.IMAGE,
                    )
                )
                self._backend = "tasks"
                logger.info("HandCropper dùng MediaPipe Tasks API")
            else:
                # Fallback: dùng solutions cũ
                self._hands_solutions = mp.solutions.hands.Hands(
                    static_image_mode=True,
                    max_num_hands=1,
                    min_detection_confidence=0.3,
                )
                self._backend = "solutions"
                logger.info("HandCropper dùng MediaPipe Solutions")
        except Exception as e:
            logger.warning("Không khởi tạo được MediaPipe detector: %s", e)
            self.detector = None
            self._backend = None

    def crop(self, image_bgr: np.ndarray, padding: float = 0.25) -> tuple[np.ndarray, Optional[list[int]]]:
        """
        Crop vùng bàn tay. Trả về (cropped_image, bbox).
        bbox = [x1, y1, x2, y2] hoặc None nếu không detect được.
        """
        h, w = image_bgr.shape[:2]
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        landmarks = None

        try:
            if self._backend == "tasks" and self.detector:
                mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
                result = self.detector.detect(mp_img)
                if result.hand_landmarks:
                    landmarks = [
                        (lm.x, lm.y) for lm in result.hand_landmarks[0]
                    ]
            elif self._backend == "solutions":
                result = self._hands_solutions.process(image_rgb)
                if result.multi_hand_landmarks:
                    landmarks = [
                        (lm.x, lm.y)
                        for lm in result.multi_hand_landmarks[0].landmark
                    ]
        except Exception as e:
            logger.debug("Crop error: %s", e)

        if not landmarks:
            # Không detect được tay — trả về ảnh gốc
            return image_bgr, None

        # Tính bounding box từ landmarks
        xs = [lm[0] for lm in landmarks]
        ys = [lm[1] for lm in landmarks]
        x1 = max(0, int((min(xs) - padding) * w))
        y1 = max(0, int((min(ys) - padding) * h))
        x2 = min(w, int((max(xs) + padding) * w))
        y2 = min(h, int((max(ys) + padding) * h))

        if x2 <= x1 or y2 <= y1:
            return image_bgr, None

        cropped = image_bgr[y1:y2, x1:x2]
        return cropped, [x1, y1, x2, y2]


class ASLCNNModel:
    """
    Wrapper cho model ASL_detector_CNN.h5 từ Kaggle.

    Cách dùng:
        model = ASLCNNModel(
            model_path=Path("model/ASL_detector_CNN.h5"),
            hand_task_path=Path("model/hand_landmarker.task"),  # optional
        )
        result = model.predict_bgr(image_bgr)
    """

    name = "ASL CNN Letter Detector (Kaggle)"

    def __init__(
        self,
        model_path: Path,
        hand_task_path: Optional[Path] = None,
        labels: Optional[list[str]] = None,
    ):
        if not TENSORFLOW_AVAILABLE:
            raise RuntimeError("TensorFlow chưa được cài: pip install tensorflow")
        if not model_path.exists():
            raise FileNotFoundError(f"Không tìm thấy model: {model_path}")

        self.model_path = model_path
        self.labels = labels or DEFAULT_LABELS
        self.model = load_model(str(model_path), compile=False)

        # Kiểm tra output shape khớp với labels
        output_shape = getattr(self.model, "output_shape", None)
        if isinstance(output_shape, tuple):
            num_classes = output_shape[-1]
            if num_classes != len(self.labels):
                logger.warning(
                    "Model output %d classes nhưng labels có %d — "
                    "sẽ dùng index trực tiếp nếu thiếu label",
                    num_classes, len(self.labels)
                )
                # Tự động mở rộng labels nếu model có nhiều class hơn
                while len(self.labels) < num_classes:
                    self.labels.append(f"class_{len(self.labels)}")

        # Tự động đọc input size từ model — không hardcode
        try:
            input_shape = self.model.input_shape  # (None, H, W, C)
            self.img_size = int(input_shape[1])
            logger.info("Model input size: %dx%d", self.img_size, self.img_size)
        except Exception:
            self.img_size = IMG_SIZE
            logger.warning("Không đọc được input shape, dùng mặc định %d", self.img_size)

        self.cropper = HandCropper(hand_task_path)
        logger.info("Loaded ASL CNN model từ %s, %d labels, input=%dx%d",
                    model_path, len(self.labels), self.img_size, self.img_size)

    def preprocess(self, image_bgr: np.ndarray) -> np.ndarray:
        """Resize ảnh về đúng format model Kaggle: 64x64 RGB, không chia /255."""
        img = cv2.resize(image_bgr, (self.img_size, self.img_size))
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Không chia /255 ở đây vì model Kaggle đã có Rescaling(1/255.0)
        img_float = img_rgb.astype(np.float32)

        return np.expand_dims(img_float, axis=0)

    def predict_bgr(self, image_bgr: np.ndarray) -> dict[str, Any]:
        """
        Nhận dạng chữ cái từ 1 frame BGR.
        Tự động crop tay nếu MediaPipe available.
        """
        try:
            # Crop vùng tay
            cropped, bbox = self.cropper.crop(image_bgr)
            
            # Preprocess
            input_tensor = self.preprocess(cropped)

            # Inference
            raw_pred = self.model.predict(input_tensor, verbose=0)[0]
            class_id = int(np.argmax(raw_pred))
            confidence = float(raw_pred[class_id])

            label = (
                self.labels[class_id]
                if class_id < len(self.labels)
                else f"class_{class_id}"
            )

            # Top 5 predictions
            top_indices = np.argsort(raw_pred)[-5:][::-1]
            top_predictions = [
                {
                    "class_id": int(i),
                    "gesture": self.labels[int(i)].lower() if int(i) < len(self.labels) else f"class_{i}",
                    "confidence": float(raw_pred[int(i)]),
                }
                for i in top_indices
            ]

            return response(
                status="success",
                gesture=label.lower(),
                confidence=confidence,
                class_id=class_id,
                top_predictions=top_predictions,
                bbox=bbox,
            )

        except Exception as e:
            logger.exception("Prediction error")
            return response(
                status="error",
                gesture=f"Prediction failed: {e}",
                confidence=0.0,
                class_id=-1,
                top_predictions=[],
                bbox=None,
            )

    def predict_bytes(self, image_bytes: bytes) -> dict[str, Any]:
        """Nhận dạng từ raw bytes (JPEG/PNG)."""
        image_bgr = image_bytes_to_bgr(image_bytes)
        return self.predict_bgr(image_bgr)

    def predict_base64(self, base64_str: str) -> dict[str, Any]:
        """Nhận dạng từ base64 string (có hoặc không có data URI prefix)."""
        import base64
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]
        image_bgr = image_bytes_to_bgr(base64.b64decode(base64_str))
        return self.predict_bgr(image_bgr)
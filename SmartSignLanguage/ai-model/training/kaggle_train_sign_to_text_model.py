"""
Kaggle training script for SmartSignLanguage realtime Sign-to-Text recognition.

Expected dataset layout:
  DATASET_DIR/
    hello/
      image1.jpg
      image2.png
      video1.mp4
    thankyou/
      ...

Kaggle quick start:
  1. Add your image/video dataset to the notebook.
  2. Upload this file or paste it into a Kaggle code cell.
  3. Set DATASET_DIR below if auto-detection picks the wrong folder.
  4. Run all cells.
  5. Download outputs from /kaggle/working/sign_to_text_model/.

Video Text-to-Sign dataset:
  - Put videos under one folder per label.
  - The script samples FRAMES_PER_VIDEO frames from each video, skipping the
    first/last VIDEO_SAMPLE_MARGIN portion by default.
  - Increase FRAMES_PER_VIDEO if each sign has long motion or few videos.

WLASL dataset:
  - The script also supports WLASL-style datasets with WLASL*.json metadata
    and videos named by video_id, without label folders.

Outputs:
  - gesture_model.h5
  - gesture_mapping.json
  - training_metadata.json
  - landmark_features.npz
  - training_history.json

Important:
  FEATURE_MODE="raw" is compatible with the current FastAPI server, which feeds
  raw MediaPipe landmarks directly into the model. Use this first.
"""

# %% Cell 1 - Install dependencies on Kaggle if needed
# The imports cell below auto-installs mediapipe when it is missing.
# If you prefer manual install, run:
# !pip install -q mediapipe --no-deps

# %% Cell 2 - Imports
from __future__ import annotations

import importlib.util
import json
import os
import random
import subprocess
import sys
import urllib.request
from dataclasses import asdict, dataclass
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("OPENCV_FFMPEG_CAPTURE_OPTIONS", "loglevel;quiet")

if importlib.util.find_spec("mediapipe") is None:
    print("mediapipe is missing. Installing mediapipe with --no-deps...")
    subprocess.check_call(
        [sys.executable, "-m", "pip", "install", "-q", "mediapipe", "--no-deps"]
    )

import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from tensorflow import keras
from tensorflow.keras import layers

try:
    cv2.setLogLevel(0)
except Exception:
    pass

try:
    from mediapipe.tasks import python as mp_tasks_python
    from mediapipe.tasks.python import vision as mp_tasks_vision
except Exception:
    mp_tasks_python = None
    mp_tasks_vision = None


# %% Cell 3 - Training config
SEED = 42
DATASET_DIR = os.environ.get("DATASET_DIR", "").strip()
OUTPUT_DIR = Path(os.environ.get("OUTPUT_DIR", "/kaggle/working/sign_to_text_model"))
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".mpeg", ".mpg"}
WLASL_JSON_GLOB = os.environ.get("WLASL_JSON_GLOB", "WLASL*.json")
HAND_LANDMARKER_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/1/hand_landmarker.task"
)

# Keep "raw" for compatibility with ai-model/inference/main.py.
# "wrist_relative" usually trains better, but inference must use the same mode.
FEATURE_MODE = os.environ.get("FEATURE_MODE", "raw").strip().lower()

MAX_IMAGES_PER_CLASS = int(os.environ.get("MAX_IMAGES_PER_CLASS", "0"))  # 0 = all
MAX_VIDEOS_PER_CLASS = int(os.environ.get("MAX_VIDEOS_PER_CLASS", "0"))  # 0 = all
FRAMES_PER_VIDEO = int(os.environ.get("FRAMES_PER_VIDEO", "24"))
VIDEO_SAMPLE_MARGIN = float(os.environ.get("VIDEO_SAMPLE_MARGIN", "0.12"))
MAX_WLASL_CLASSES = int(os.environ.get("MAX_WLASL_CLASSES", "0"))  # 0 = all
MAX_WLASL_VIDEOS_PER_CLASS = int(os.environ.get("MAX_WLASL_VIDEOS_PER_CLASS", "0"))
TEST_SIZE = float(os.environ.get("TEST_SIZE", "0.2"))
VAL_SIZE = float(os.environ.get("VAL_SIZE", "0.15"))
EPOCHS = int(os.environ.get("EPOCHS", "80"))
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "32"))
MIN_DETECTION_CONFIDENCE = float(os.environ.get("MIN_DETECTION_CONFIDENCE", "0.5"))


random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# %% Cell 4 - Config dataclass for metadata
@dataclass
class TrainingConfig:
    dataset_dir: str
    output_dir: str
    feature_mode: str
    max_images_per_class: int
    max_videos_per_class: int
    frames_per_video: int
    video_sample_margin: float
    max_wlasl_classes: int
    max_wlasl_videos_per_class: int
    test_size: float
    val_size: float
    epochs: int
    batch_size: int
    min_detection_confidence: float
    seed: int


# %% Cell 5 - Dataset discovery helpers
def contains_media_files(path: Path) -> bool:
    return any(
        child.is_file()
        and child.suffix.lower() in IMAGE_EXTENSIONS.union(VIDEO_EXTENSIONS)
        for child in path.iterdir()
    )


def class_folders(root: Path) -> list[Path]:
    return sorted(
        path
        for path in root.iterdir()
        if path.is_dir() and contains_media_files(path)
    )


def best_class_root(base: Path) -> tuple[Path | None, int]:
    best_root: Path | None = None
    best_count = 0
    search_roots = [base, *[path for path in base.rglob("*") if path.is_dir()]]

    for root in search_roots:
        count = len(class_folders(root))
        if count > best_count:
            best_root = root
            best_count = count

    return best_root, best_count


def find_dataset_root() -> Path:
    if DATASET_DIR:
        path = Path(DATASET_DIR)
        if not path.exists():
            raise FileNotFoundError(f"DATASET_DIR does not exist: {path}")
        folders = class_folders(path)
        if folders:
            return path

        nested_root, nested_count = best_class_root(path)
        if nested_root is not None and nested_count > 0:
            print(
                f"DATASET_DIR points to a parent folder. "
                f"Using nested class root: {nested_root}"
            )
            return nested_root

        if not list(path.rglob(WLASL_JSON_GLOB)):
            raise FileNotFoundError(
                f"No class folders or WLASL JSON metadata under: {path}"
            )
        return path

    candidates = [Path("/kaggle/input"), Path.cwd()]
    best_root: Path | None = None
    best_count = 0

    for base in candidates:
        if not base.exists():
            continue
        nested_root, nested_count = best_class_root(base)
        if nested_root is not None and nested_count > best_count:
            best_root = nested_root
            best_count = nested_count

        for root in [base, *[p for p in base.rglob("*") if p.is_dir()]]:
            wlasl_score = len(list(root.glob(WLASL_JSON_GLOB))) * 1000
            if wlasl_score > best_count:
                best_root = root
                best_count = wlasl_score

    if best_root is None:
        raise FileNotFoundError(
            "Could not auto-detect dataset root. Set DATASET_DIR to the folder "
            "that contains one subfolder per gesture class or WLASL JSON metadata."
        )

    return best_root


# %% Cell 6 - Find dataset root and class folders
dataset_root = find_dataset_root()
classes = [folder.name for folder in class_folders(dataset_root)]
print("Dataset root:", dataset_root)
print("Class folders:", len(classes), classes[:50])
print("WLASL JSON files:", [str(path) for path in dataset_root.rglob(WLASL_JSON_GLOB)])


# %% Cell 7 - Initialize MediaPipe Hands
def ensure_hand_landmarker_task() -> Path:
    path = OUTPUT_DIR / "hand_landmarker.task"
    if path.exists():
        return path

    print("Downloading MediaPipe hand_landmarker.task...")
    try:
        urllib.request.urlretrieve(HAND_LANDMARKER_URL, path)
    except Exception as exc:
        raise RuntimeError(
            "This MediaPipe version does not provide mp.solutions, so the "
            "MediaPipe Tasks hand_landmarker.task model is required. Enable "
            "internet in Kaggle or manually upload hand_landmarker.task and set "
            f"it at: {path}"
        ) from exc

    return path


class HandLandmarkExtractor:
    def __init__(self):
        self.backend = ""
        self.solutions_hands = None
        self.tasks_landmarker = None

        if hasattr(mp, "solutions") and hasattr(mp.solutions, "hands"):
            self.backend = "mediapipe-solutions"
            self.solutions_hands = mp.solutions.hands.Hands(
                static_image_mode=True,
                max_num_hands=1,
                min_detection_confidence=MIN_DETECTION_CONFIDENCE,
            )
            return

        if mp_tasks_python is None or mp_tasks_vision is None:
            raise RuntimeError(
                "mediapipe has no mp.solutions and mediapipe.tasks could not be imported."
            )

        self.backend = "mediapipe-tasks"
        options = mp_tasks_vision.HandLandmarkerOptions(
            base_options=mp_tasks_python.BaseOptions(
                model_asset_path=str(ensure_hand_landmarker_task())
            ),
            running_mode=mp_tasks_vision.RunningMode.IMAGE,
            num_hands=1,
            min_hand_detection_confidence=MIN_DETECTION_CONFIDENCE,
            min_hand_presence_confidence=MIN_DETECTION_CONFIDENCE,
        )
        self.tasks_landmarker = mp_tasks_vision.HandLandmarker.create_from_options(options)

    def extract_raw_landmarks(self, image_rgb: np.ndarray) -> np.ndarray | None:
        if self.solutions_hands is not None:
            results = self.solutions_hands.process(image_rgb)
            if not results.multi_hand_landmarks:
                return None

            hand_landmarks = results.multi_hand_landmarks[0]
            return np.array(
                [[point.x, point.y, point.z] for point in hand_landmarks.landmark],
                dtype=np.float32,
            ).flatten()

        if self.tasks_landmarker is None:
            return None

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
        results = self.tasks_landmarker.detect(mp_image)
        if not results.hand_landmarks:
            return None

        hand_landmarks = results.hand_landmarks[0]
        return np.array(
            [[point.x, point.y, point.z] for point in hand_landmarks],
            dtype=np.float32,
        ).flatten()


hands = HandLandmarkExtractor()
print("MediaPipe backend:", hands.backend)


# %% Cell 8 - Media path helpers
def limited_paths(paths: list[Path], limit: int) -> list[Path]:
    paths = sorted(paths)
    if limit > 0:
        random.shuffle(paths)
        paths = sorted(paths[:limit])
    return paths


def image_paths(folder: Path) -> list[Path]:
    return limited_paths(
        [
            path
            for path in folder.iterdir()
            if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
        ],
        MAX_IMAGES_PER_CLASS,
    )


def video_paths(folder: Path) -> list[Path]:
    return limited_paths(
        [
            path
            for path in folder.iterdir()
            if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS
        ],
        MAX_VIDEOS_PER_CLASS,
    )


def sample_frame_indices(total_frames: int, frames_per_video: int) -> list[int]:
    if total_frames <= 0:
        return []

    count = min(frames_per_video, total_frames)
    start = int(total_frames * VIDEO_SAMPLE_MARGIN)
    end = int(total_frames * (1.0 - VIDEO_SAMPLE_MARGIN)) - 1
    if end <= start:
        start, end = 0, total_frames - 1

    return sorted(set(np.linspace(start, end, count, dtype=int).tolist()))


def media_paths(folder: Path) -> tuple[list[Path], list[Path]]:
    return image_paths(folder), video_paths(folder)


# %% Cell 9 - WLASL metadata helpers
def video_file_index(root: Path) -> dict[str, Path]:
    index: dict[str, Path] = {}
    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS:
            index[path.stem] = path
    return index


def wlasl_json_files(root: Path) -> list[Path]:
    return sorted(root.rglob(WLASL_JSON_GLOB))


def load_wlasl_manifest(root: Path) -> list[tuple[str, Path]]:
    json_files = wlasl_json_files(root)
    if not json_files:
        return []

    videos = video_file_index(root)
    manifest: list[tuple[str, Path]] = []
    missing = 0

    for json_path in json_files:
        with json_path.open("r", encoding="utf-8") as file:
            data = json.load(file)

        if not isinstance(data, list):
            continue

        for entry in data:
            gloss = str(entry.get("gloss", "")).strip()
            instances = entry.get("instances", [])
            if not gloss or not isinstance(instances, list):
                continue

            class_count = 0
            for instance in instances:
                video_id = str(instance.get("video_id", "")).strip()
                if not video_id:
                    continue
                video_path = videos.get(video_id)
                if video_path is None:
                    missing += 1
                    continue
                manifest.append((gloss, video_path))
                class_count += 1
                if (
                    MAX_WLASL_VIDEOS_PER_CLASS > 0
                    and class_count >= MAX_WLASL_VIDEOS_PER_CLASS
                ):
                    break

    if MAX_WLASL_CLASSES > 0:
        allowed = sorted({label for label, _ in manifest})[:MAX_WLASL_CLASSES]
        allowed_set = set(allowed)
        manifest = [(label, path) for label, path in manifest if label in allowed_set]

    print(
        f"WLASL manifest: {len(manifest)} videos, "
        f"{len(set(label for label, _ in manifest))} classes, missing={missing}"
    )
    return manifest


# %% Cell 10 - Feature normalization
def normalize_wrist_relative(landmarks: np.ndarray) -> np.ndarray:
    """Normalize 21x3 landmarks by wrist and hand scale."""
    points = landmarks.reshape(21, 3).astype(np.float32)
    wrist = points[0].copy()
    centered = points - wrist
    xy = centered[:, :2]
    scale = float(np.max(np.linalg.norm(xy, axis=1)))
    if scale < 1e-6:
        scale = 1.0
    centered[:, :2] /= scale
    centered[:, 2] /= scale
    return centered.flatten().astype(np.float32)


def features_from_landmarks(landmarks: np.ndarray) -> np.ndarray:
    if FEATURE_MODE == "raw":
        return landmarks.astype(np.float32)
    if FEATURE_MODE == "wrist_relative":
        return normalize_wrist_relative(landmarks)
    raise ValueError(f"Unsupported FEATURE_MODE: {FEATURE_MODE}")


# %% Cell 11 - Extract landmarks from images and video frames
def extract_landmarks_from_bgr(image_bgr: np.ndarray) -> np.ndarray | None:
    if image_bgr is None:
        return None

    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    landmarks = hands.extract_raw_landmarks(image_rgb)
    if landmarks is None:
        return None

    return features_from_landmarks(landmarks)


def extract_landmarks_from_image(path: Path) -> np.ndarray | None:
    return extract_landmarks_from_bgr(cv2.imread(str(path)))


def extract_landmarks_from_video(path: Path) -> tuple[list[np.ndarray], int]:
    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        return [], FRAMES_PER_VIDEO

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    target_indices = set(sample_frame_indices(total_frames, FRAMES_PER_VIDEO))
    features: list[np.ndarray] = []
    skipped = 0
    frame_index = 0

    while frame_index < total_frames and len(features) + skipped < len(target_indices):
        ok, frame = cap.read()
        should_sample = frame_index in target_indices
        frame_index += 1

        if not should_sample:
            continue

        if not ok:
            skipped += 1
            continue

        landmarks = extract_landmarks_from_bgr(frame)
        if landmarks is None:
            skipped += 1
            continue
        features.append(landmarks)

    cap.release()
    skipped += max(0, len(target_indices) - len(features) - skipped)
    return features, skipped


# %% Cell 12 - Smoke test one sample before full extraction
def first_media_file(root: Path) -> Path | None:
    manifest = load_wlasl_manifest(root)
    if manifest:
        return manifest[0][1]

    for folder in class_folders(root):
        images, videos = media_paths(folder)
        if images:
            return images[0]
        if videos:
            return videos[0]
    return None


sample_path = first_media_file(dataset_root)
if sample_path is None:
    raise RuntimeError("No image or video files found in class folders.")

if sample_path.suffix.lower() in IMAGE_EXTENSIONS:
    sample_features = extract_landmarks_from_image(sample_path)
    print("Smoke test image:", sample_path)
    print("Smoke test feature shape:", None if sample_features is None else sample_features.shape)
else:
    sample_features_list, sample_skipped = extract_landmarks_from_video(sample_path)
    print("Smoke test video:", sample_path)
    print("Smoke test extracted frames:", len(sample_features_list), "skipped:", sample_skipped)
    if sample_features_list:
        print("Smoke test feature shape:", sample_features_list[0].shape)


# %% Cell 13 - Build landmark feature dataset
def build_feature_dataset(
    root: Path,
) -> tuple[np.ndarray, np.ndarray, dict[str, dict[str, int]]]:
    features: list[np.ndarray] = []
    labels: list[str] = []
    summary_by_class: dict[str, dict[str, int]] = {}
    manifest = load_wlasl_manifest(root)

    if manifest:
        grouped: dict[str, list[Path]] = {}
        for gesture, path in manifest:
            grouped.setdefault(gesture, []).append(path)

        for gesture, paths in sorted(grouped.items()):
            skipped_video_frames = 0
            kept_before = labels.count(gesture)
            print(f"Processing {gesture}: {len(paths)} WLASL videos")

            for path in paths:
                video_features, skipped = extract_landmarks_from_video(path)
                skipped_video_frames += skipped
                features.extend(video_features)
                labels.extend([gesture] * len(video_features))

            kept = labels.count(gesture) - kept_before
            summary_by_class[gesture] = {
                "images": 0,
                "videos": len(paths),
                "kept_samples": kept,
                "skipped_images_no_hand": 0,
                "skipped_video_frames_no_hand": skipped_video_frames,
            }
            print(f"  kept={kept} skipped_video_frames={skipped_video_frames}")

        if not features:
            raise RuntimeError(
                "WLASL metadata was found, but no hand landmarks were extracted. "
                "Check video files and MediaPipe detection."
            )

        return np.vstack(features).astype(np.float32), np.array(labels), summary_by_class

    for folder in class_folders(root):
        gesture = folder.name
        image_files, video_files = media_paths(folder)
        skipped_images = 0
        skipped_video_frames = 0
        kept_before = labels.count(gesture)
        print(
            f"Processing {gesture}: "
            f"{len(image_files)} images, {len(video_files)} videos"
        )

        for path in image_files:
            landmarks = extract_landmarks_from_image(path)
            if landmarks is None:
                skipped_images += 1
                continue
            features.append(landmarks)
            labels.append(gesture)

        for path in video_files:
            video_features, skipped = extract_landmarks_from_video(path)
            skipped_video_frames += skipped
            features.extend(video_features)
            labels.extend([gesture] * len(video_features))

        kept = labels.count(gesture) - kept_before
        summary_by_class[gesture] = {
            "images": len(image_files),
            "videos": len(video_files),
            "kept_samples": kept,
            "skipped_images_no_hand": skipped_images,
            "skipped_video_frames_no_hand": skipped_video_frames,
        }
        print(
            f"  kept={kept} skipped_images={skipped_images} "
            f"skipped_video_frames={skipped_video_frames}"
        )

    if not features:
        raise RuntimeError("No hand landmarks extracted. Check image quality and dataset layout.")

    return np.vstack(features).astype(np.float32), np.array(labels), summary_by_class


# %% Cell 14 - Run full feature extraction
X, y, dataset_summary = build_feature_dataset(dataset_root)
print("Feature shape:", X.shape)
print("Samples:", len(y))
print("Class counts:", {label: int(np.sum(y == label)) for label in sorted(set(y))})


# %% Cell 15 - Save extracted landmark features
np.savez_compressed(
    OUTPUT_DIR / "landmark_features.npz",
    X=X,
    y=y,
    feature_mode=FEATURE_MODE,
)


# %% Cell 16 - Model definition
def make_model(input_dim: int, num_classes: int) -> keras.Model:
    model = keras.Sequential(
        [
            keras.Input(shape=(input_dim,)),
            layers.BatchNormalization(),
            layers.Dense(256, activation="relu"),
            layers.Dropout(0.35),
            layers.Dense(128, activation="relu"),
            layers.Dropout(0.3),
            layers.Dense(64, activation="relu"),
            layers.Dropout(0.2),
            layers.Dense(num_classes, activation="softmax"),
        ]
    )
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


# %% Cell 17 - Encode labels and split train/validation/test
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)
num_classes = len(label_encoder.classes_)

stratify = y_encoded if min(np.bincount(y_encoded)) >= 2 else None
X_train_full, X_test, y_train_full, y_test = train_test_split(
    X,
    y_encoded,
    test_size=TEST_SIZE,
    random_state=SEED,
    stratify=stratify,
)

train_counts = np.bincount(y_train_full, minlength=num_classes)
stratify_train = y_train_full if min(train_counts) >= 2 else None
X_train, X_val, y_train, y_val = train_test_split(
    X_train_full,
    y_train_full,
    test_size=VAL_SIZE,
    random_state=SEED,
    stratify=stratify_train,
)


# %% Cell 18 - Create model and training callbacks
model = make_model(X.shape[1], num_classes)
callbacks = [
    keras.callbacks.EarlyStopping(
        monitor="val_accuracy",
        patience=12,
        restore_best_weights=True,
    ),
    keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=5,
        min_lr=1e-5,
    ),
    keras.callbacks.ModelCheckpoint(
        str(OUTPUT_DIR / "gesture_model_best.keras"),
        monitor="val_accuracy",
        save_best_only=True,
    ),
]


# %% Cell 19 - Train model
history = model.fit(
    X_train,
    y_train,
    validation_data=(X_val, y_val),
    epochs=EPOCHS,
    batch_size=BATCH_SIZE,
    callbacks=callbacks,
    verbose=1,
)


# %% Cell 20 - Evaluate model
test_loss, test_accuracy = model.evaluate(X_test, y_test, verbose=0)
pred_probs = model.predict(X_test, verbose=0)
y_pred = np.argmax(pred_probs, axis=1)

print(f"Test loss: {test_loss:.4f}")
print(f"Test accuracy: {test_accuracy:.4f}")
print(
    classification_report(
        y_test,
        y_pred,
        target_names=list(label_encoder.classes_),
        zero_division=0,
    )
)
print("Confusion matrix:")
print(confusion_matrix(y_test, y_pred))


# %% Cell 21 - Save model and label mapping
model.save(OUTPUT_DIR / "gesture_model.h5")
model.save(OUTPUT_DIR / "gesture_model.keras")

mapping = {int(index): label for index, label in enumerate(label_encoder.classes_)}
with (OUTPUT_DIR / "gesture_mapping.json").open("w", encoding="utf-8") as file:
    json.dump(mapping, file, ensure_ascii=False, indent=2)


# %% Cell 22 - Save metadata and training history
config = TrainingConfig(
    dataset_dir=str(dataset_root),
    output_dir=str(OUTPUT_DIR),
    feature_mode=FEATURE_MODE,
    max_images_per_class=MAX_IMAGES_PER_CLASS,
    max_videos_per_class=MAX_VIDEOS_PER_CLASS,
    frames_per_video=FRAMES_PER_VIDEO,
    video_sample_margin=VIDEO_SAMPLE_MARGIN,
    max_wlasl_classes=MAX_WLASL_CLASSES,
    max_wlasl_videos_per_class=MAX_WLASL_VIDEOS_PER_CLASS,
    test_size=TEST_SIZE,
    val_size=VAL_SIZE,
    epochs=EPOCHS,
    batch_size=BATCH_SIZE,
    min_detection_confidence=MIN_DETECTION_CONFIDENCE,
    seed=SEED,
)
metadata = {
    "config": asdict(config),
    "num_samples": int(len(y)),
    "num_classes": int(num_classes),
    "classes": list(label_encoder.classes_),
    "dataset_summary_by_class": dataset_summary,
    "test_loss": float(test_loss),
    "test_accuracy": float(test_accuracy),
    "input_dim": int(X.shape[1]),
    "compatible_with_current_server": FEATURE_MODE == "raw",
}
with (OUTPUT_DIR / "training_metadata.json").open("w", encoding="utf-8") as file:
    json.dump(metadata, file, ensure_ascii=False, indent=2)

history_df = {
    key: [float(value) for value in values]
    for key, values in history.history.items()
}
with (OUTPUT_DIR / "training_history.json").open("w", encoding="utf-8") as file:
    json.dump(history_df, file, ensure_ascii=False, indent=2)


# %% Cell 23 - Final output summary
print("Saved outputs to:", OUTPUT_DIR)
print("Use these files in legacy-converters/Sign-to-Text-Convertor:")
print(" - gesture_model.h5")
print(" - gesture_mapping.json")

import json
import os
import subprocess
import sys
import urllib.request
from pathlib import Path
from typing import Any

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
os.environ.setdefault("GLOG_minloglevel", "2")
os.environ.setdefault("ABSL_LOGGING_MIN_LOG_LEVEL", "2")


def ensure_packages() -> None:
    packages = {
        "cv2": "opencv-python-headless",
        "mediapipe": "mediapipe",
        "numpy": "numpy",
        "scipy": "scipy",
        "tqdm": "tqdm",
    }
    missing = []

    for module_name, package_name in packages.items():
        try:
            __import__(module_name)
        except ModuleNotFoundError:
            missing.append(package_name)

    if missing:
        print(f"Installing missing packages: {', '.join(missing)}")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", *missing])


ensure_packages()

import cv2
import numpy as np
from scipy.interpolate import interp1d
from tqdm import tqdm

print("Imports OK")

# %% Cell 2 - Load MediaPipe Pose and Hands
def download_file(url: str, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.exists() and output_path.stat().st_size > 0:
        return output_path
    print(f"Downloading {url}")
    urllib.request.urlretrieve(url, output_path)
    return output_path


def load_mediapipe_solutions():
    try:
        import mediapipe as mp

        if (
            hasattr(mp, "solutions")
            and hasattr(mp.solutions, "pose")
            and hasattr(mp.solutions, "hands")
        ):
            print("Using mediapipe.solutions")
            return {
                "backend": "solutions",
                "mp": mp,
                "pose": mp.solutions.pose,
                "hands": mp.solutions.hands,
            }
    except Exception as exc:
        print("mediapipe.solutions import failed:", repr(exc))

    try:
        from mediapipe.python.solutions import hands, pose

        print("Using mediapipe.python.solutions")
        return {
            "backend": "solutions",
            "mp": None,
            "pose": pose,
            "hands": hands,
        }
    except Exception as exc:
        print("mediapipe.python.solutions import failed:", repr(exc))

    try:
        import mediapipe as mp
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision

        model_dir = Path("/kaggle/working/mediapipe_models")
        pose_model = download_file(
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
            model_dir / "pose_landmarker_lite.task",
        )
        hand_model = download_file(
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
            model_dir / "hand_landmarker.task",
        )

        print("Using mediapipe.tasks vision landmarker API")
        return {
            "backend": "tasks",
            "mp": mp,
            "python": python,
            "vision": vision,
            "pose_model": pose_model,
            "hand_model": hand_model,
        }
    except Exception as exc:
        raise RuntimeError(
            "MediaPipe is installed, but neither legacy solutions nor Tasks "
            "Vision API could be initialized."
        ) from exc


MP = load_mediapipe_solutions()
print("MediaPipe backend:", MP["backend"])

# %% Cell 3 - Configuration
KAGGLE_INPUT = Path("/kaggle/input")
DATASET_ROOT_ENV = os.environ.get("DATASET_ROOT", "").strip()
DATASET_ROOT = Path(DATASET_ROOT_ENV) if DATASET_ROOT_ENV else None
OUTPUT_FILE = Path(os.environ.get("OUTPUT_FILE", "/kaggle/working/combined_avg_landmarks.json"))
CHECKPOINT_FILE = Path(
    os.environ.get("CHECKPOINT_FILE", "/kaggle/working/combined_avg_landmarks.checkpoint.json")
)
VIDEO_EXTS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}

# Empty WORDS means all folders. Example: WORDS="hello,thank you,book"
SELECTED_WORDS = [
    word.strip().lower()
    for word in os.environ.get("WORDS", "").split(",")
    if word.strip()
]

# Speed/quality knobs.
# SPEED_PRESET:
# - fast: quickest first output, lower quality
# - balanced: practical full-dataset default
# - quality: slower, better averaging
SPEED_PRESET = os.environ.get("SPEED_PRESET", "balanced").strip().lower()
PRESETS = {
    "fast": {
        "max_videos_per_word": "1",
        "target_frames": "24",
        "frame_stride": "4",
        "max_source_frames": "48",
        "min_valid_frames": "4",
        "min_hand_frame_ratio": "0.05",
    },
    "balanced": {
        "max_videos_per_word": "3",
        "target_frames": "32",
        "frame_stride": "2",
        "max_source_frames": "96",
        "min_valid_frames": "6",
        "min_hand_frame_ratio": "0.08",
    },
    "quality": {
        "max_videos_per_word": "5",
        "target_frames": "48",
        "frame_stride": "1",
        "max_source_frames": "160",
        "min_valid_frames": "8",
        "min_hand_frame_ratio": "0.12",
    },
}
if SPEED_PRESET not in PRESETS:
    raise ValueError(f"Invalid SPEED_PRESET={SPEED_PRESET!r}. Use fast, balanced, or quality.")

preset = PRESETS[SPEED_PRESET]
# Default to a manageable subset for Kaggle runs. Set MAX_WORDS="" or remove this
# default if you want to process every word folder.
MAX_WORDS = int(os.environ.get("MAX_WORDS", "500")) if os.environ.get("MAX_WORDS", "500") else None
MAX_VIDEOS_PER_WORD = int(os.environ.get("MAX_VIDEOS_PER_WORD", preset["max_videos_per_word"]))
TARGET_FRAMES = int(os.environ.get("TARGET_FRAMES", preset["target_frames"]))
FRAME_STRIDE = int(os.environ.get("FRAME_STRIDE", preset["frame_stride"]))
MAX_SOURCE_FRAMES = int(os.environ.get("MAX_SOURCE_FRAMES", preset["max_source_frames"]))
MIN_VALID_FRAMES = int(os.environ.get("MIN_VALID_FRAMES", preset["min_valid_frames"]))
MIN_HAND_FRAME_RATIO = float(os.environ.get("MIN_HAND_FRAME_RATIO", preset["min_hand_frame_ratio"]))
POSE_MODEL_COMPLEXITY = int(os.environ.get("POSE_MODEL_COMPLEXITY", "0"))
RESUME = os.environ.get("RESUME", "1") != "0"
VERBOSE = os.environ.get("VERBOSE", "0") == "1"
CHECKPOINT_EVERY = int(os.environ.get("CHECKPOINT_EVERY", "25"))

USE_POSE = os.environ.get("USE_POSE", "1") != "0"
USE_HANDS = os.environ.get("USE_HANDS", "1") != "0"

KEYS = ["pose", "left_hand", "right_hand"]

print("Mode:", "SELECTED WORDS" if SELECTED_WORDS else "ALL WORDS")
print("SPEED_PRESET:", SPEED_PRESET)
print("WORDS:", SELECTED_WORDS if SELECTED_WORDS else "(all)")
print("MAX_WORDS:", MAX_WORDS)
print("MAX_VIDEOS_PER_WORD:", MAX_VIDEOS_PER_WORD)
print("TARGET_FRAMES:", TARGET_FRAMES)
print("FRAME_STRIDE:", FRAME_STRIDE)
print("MAX_SOURCE_FRAMES:", MAX_SOURCE_FRAMES)
print("MIN_VALID_FRAMES:", MIN_VALID_FRAMES)
print("MIN_HAND_FRAME_RATIO:", MIN_HAND_FRAME_RATIO)
print("POSE_MODEL_COMPLEXITY:", POSE_MODEL_COMPLEXITY)
print("RESUME:", RESUME)
print("VERBOSE:", VERBOSE)
print("CHECKPOINT_EVERY:", CHECKPOINT_EVERY)

# %% Cell 4 - Find dataset root and word folders
def normalize_label(folder_name: str) -> str:
    return folder_name.strip().lower().replace("_", " ")


def list_videos(word_dir: Path) -> list[Path]:
    return sorted(
        [
            path
            for path in word_dir.rglob("*")
            if path.is_file() and path.suffix.lower() in VIDEO_EXTS
        ],
        key=lambda path: str(path),
    )


def find_dataset_root() -> Path:
    if DATASET_ROOT is not None:
        if not DATASET_ROOT.exists():
            raise FileNotFoundError(f"DATASET_ROOT does not exist: {DATASET_ROOT}")
        return DATASET_ROOT

    sl_candidates = [
        path
        for path in KAGGLE_INPUT.rglob("SL")
        if path.is_dir() and any(child.is_dir() for child in path.iterdir())
    ]
    if sl_candidates:
        sl_candidates.sort(key=lambda path: len(str(path)))
        return sl_candidates[0]

    candidates = []
    for path in KAGGLE_INPUT.rglob("*"):
        if not path.is_dir():
            continue
        child_dirs = [child for child in path.iterdir() if child.is_dir()]
        if not child_dirs:
            continue

        video_count = 0
        for child in child_dirs[:30]:
            video_count += sum(1 for file in child.iterdir() if file.suffix.lower() in VIDEO_EXTS)
        if video_count > 0:
            candidates.append((video_count, path))

    if not candidates:
        raise FileNotFoundError("No dataset root with word folders and videos found under /kaggle/input.")

    candidates.sort(reverse=True, key=lambda item: item[0])
    return candidates[0][1]


dataset_root = find_dataset_root()
word_dirs = sorted(
    [
        path
        for path in dataset_root.iterdir()
        if path.is_dir() and list_videos(path)
    ],
    key=lambda p: p.name,
)

if SELECTED_WORDS:
    selected = set(SELECTED_WORDS)
    word_dirs = [path for path in word_dirs if normalize_label(path.name) in selected]

if MAX_WORDS:
    word_dirs = word_dirs[:MAX_WORDS]

found = {normalize_label(path.name) for path in word_dirs}
missing = [word for word in SELECTED_WORDS if word not in found]

print("Dataset root:", dataset_root)
print("Word folder count:", len(word_dirs))
print("First folders:", [path.name for path in word_dirs[:20]])
if missing:
    print("Missing selected folders:", missing)

if not word_dirs:
    raise RuntimeError("No word folders found. Check DATASET_ROOT or WORDS.")

# %% Cell 5 - Landmark extraction functions
def landmark_list(landmarks: Any, include_visibility: bool = False) -> list[dict[str, float]]:
    source = landmarks.landmark if hasattr(landmarks, "landmark") else landmarks
    output = []
    for landmark in source:
        point = {
            "x": float(landmark.x),
            "y": float(landmark.y),
            "z": float(landmark.z),
        }
        if include_visibility:
            point["v"] = float(getattr(landmark, "visibility", 0.0))
        output.append(point)
    return output


def assign_hands_solutions(results: Any) -> dict[str, list[dict[str, float]]]:
    assigned: dict[str, list[dict[str, float]]] = {}
    if not results.multi_hand_landmarks:
        return assigned

    for index, hand_landmarks in enumerate(results.multi_hand_landmarks):
        label = ""
        if results.multi_handedness and index < len(results.multi_handedness):
            label = results.multi_handedness[index].classification[0].label.lower()

        key = "left_hand" if label == "left" else "right_hand"
        if key in assigned:
            key = "right_hand" if key == "left_hand" else "left_hand"
        assigned[key] = landmark_list(hand_landmarks)

    return assigned


def assign_hands_tasks(results: Any) -> dict[str, list[dict[str, float]]]:
    assigned: dict[str, list[dict[str, float]]] = {}
    if not results.hand_landmarks:
        return assigned

    for index, hand_landmarks in enumerate(results.hand_landmarks):
        label = ""
        if results.handedness and index < len(results.handedness) and results.handedness[index]:
            label = results.handedness[index][0].category_name.lower()

        key = "left_hand" if label == "left" else "right_hand"
        if key in assigned:
            key = "right_hand" if key == "left_hand" else "left_hand"
        assigned[key] = landmark_list(hand_landmarks)

    return assigned


def open_detectors():
    if MP["backend"] == "solutions":
        pose_detector = (
            MP["pose"].Pose(
                static_image_mode=False,
                model_complexity=POSE_MODEL_COMPLEXITY,
                smooth_landmarks=True,
                enable_segmentation=False,
                min_detection_confidence=0.45,
                min_tracking_confidence=0.45,
            )
            if USE_POSE
            else None
        )
        hand_detector = (
            MP["hands"].Hands(
                static_image_mode=False,
                max_num_hands=2,
                model_complexity=0,
                min_detection_confidence=0.45,
                min_tracking_confidence=0.45,
            )
            if USE_HANDS
            else None
        )
        return pose_detector, hand_detector

    vision = MP["vision"]
    python_api = MP["python"]
    running_mode = vision.RunningMode.VIDEO
    pose_detector = (
        vision.PoseLandmarker.create_from_options(
            vision.PoseLandmarkerOptions(
                base_options=python_api.BaseOptions(model_asset_path=str(MP["pose_model"])),
                running_mode=running_mode,
                num_poses=1,
                min_pose_detection_confidence=0.45,
                min_pose_presence_confidence=0.45,
                min_tracking_confidence=0.45,
            )
        )
        if USE_POSE
        else None
    )
    hand_detector = (
        vision.HandLandmarker.create_from_options(
            vision.HandLandmarkerOptions(
                base_options=python_api.BaseOptions(model_asset_path=str(MP["hand_model"])),
                running_mode=running_mode,
                num_hands=2,
                min_hand_detection_confidence=0.45,
                min_hand_presence_confidence=0.45,
                min_tracking_confidence=0.45,
            )
        )
        if USE_HANDS
        else None
    )
    return pose_detector, hand_detector


def extract_from_video(video_path: Path) -> list[dict[str, Any]]:
    frames: list[dict[str, Any]] = []
    pose_detector, hand_detector = open_detectors()

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    source_frame_index = 0
    processed_frame_count = 0

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        source_frame_index += 1
        if FRAME_STRIDE > 1 and source_frame_index % FRAME_STRIDE != 0:
            continue
        if processed_frame_count >= MAX_SOURCE_FRAMES:
            break

        processed_frame_count += 1
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame_data: dict[str, Any] = {}

        timestamp_ms = int((source_frame_index / max(cap.get(cv2.CAP_PROP_FPS), 1)) * 1000)

        if MP["backend"] == "tasks":
            mp_image = MP["mp"].Image(image_format=MP["mp"].ImageFormat.SRGB, data=rgb)
            if pose_detector:
                pose_results = pose_detector.detect_for_video(mp_image, timestamp_ms)
                if pose_results.pose_landmarks:
                    frame_data["pose"] = landmark_list(
                        pose_results.pose_landmarks[0],
                        include_visibility=True,
                    )
            if hand_detector:
                hand_results = hand_detector.detect_for_video(mp_image, timestamp_ms)
                frame_data.update(assign_hands_tasks(hand_results))
        elif pose_detector:
            pose_results = pose_detector.process(rgb)
            if pose_results.pose_landmarks:
                frame_data["pose"] = landmark_list(
                    pose_results.pose_landmarks,
                    include_visibility=True,
                )

            if hand_detector:
                hand_results = hand_detector.process(rgb)
                frame_data.update(assign_hands_solutions(hand_results))

        # Keep only frames with pose or hands. This improves average quality.
        if frame_data:
            frames.append(frame_data)

    cap.release()
    if pose_detector:
        pose_detector.close()
    if hand_detector:
        hand_detector.close()
    return frames


def sequence_quality(sequence: list[dict[str, Any]]) -> dict[str, float]:
    if not sequence:
        return {"frames": 0, "hand_ratio": 0.0}
    hand_frames = sum(1 for frame in sequence if "left_hand" in frame or "right_hand" in frame)
    return {
        "frames": float(len(sequence)),
        "hand_ratio": hand_frames / len(sequence),
    }


print("Extraction functions ready")

# %% Cell 6 - Smoke test one video
first_word_dir = word_dirs[0]
first_videos = list_videos(first_word_dir)
if not first_videos:
    raise RuntimeError(f"No videos found inside smoke-test folder: {first_word_dir}")
first_video = first_videos[0]
print("Testing:", first_video)

test_frames = extract_from_video(first_video)
test_quality = sequence_quality(test_frames)
print("Extracted frames:", len(test_frames))
print("Quality:", test_quality)
print("First frame keys:", list(test_frames[0].keys()) if test_frames else [])

if len(test_frames) < MIN_VALID_FRAMES:
    raise RuntimeError("Smoke test extracted too few frames. Lower FRAME_STRIDE or check video visibility.")

# %% Cell 7 - Resample and average functions
def resample_sequence(sequence: list[dict[str, Any]], target_len: int) -> list[dict[str, Any]]:
    if len(sequence) == target_len:
        return sequence
    if len(sequence) < 2:
        return sequence

    old_index = np.linspace(0, 1, len(sequence))
    new_index = np.linspace(0, 1, target_len)
    output: list[dict[str, Any]] = [{} for _ in range(target_len)]

    for key in KEYS:
        first = next((frame[key] for frame in sequence if key in frame and frame[key]), None)
        if not first:
            continue

        for landmark_i in range(len(first)):
            valid_t, xs, ys, zs, vs = [], [], [], [], []
            for frame_i, frame in enumerate(sequence):
                if key not in frame or landmark_i >= len(frame[key]):
                    continue
                point = frame[key][landmark_i]
                valid_t.append(old_index[frame_i])
                xs.append(point["x"])
                ys.append(point["y"])
                zs.append(point["z"])
                vs.append(point.get("v", 0.0))

            if len(valid_t) < 2:
                continue

            fx = interp1d(valid_t, xs, kind="linear", bounds_error=False, fill_value="extrapolate")
            fy = interp1d(valid_t, ys, kind="linear", bounds_error=False, fill_value="extrapolate")
            fz = interp1d(valid_t, zs, kind="linear", bounds_error=False, fill_value="extrapolate")
            fv = interp1d(valid_t, vs, kind="linear", bounds_error=False, fill_value="extrapolate")

            for frame_i, t in enumerate(new_index):
                output[frame_i].setdefault(key, [])
                output[frame_i][key].append(
                    {
                        "x": float(fx(t)),
                        "y": float(fy(t)),
                        "z": float(fz(t)),
                        "v": float(fv(t)),
                    }
                )

    return output


def average_sequences(sequences: list[list[dict[str, Any]]]) -> list[dict[str, Any]]:
    sequences = [seq for seq in sequences if len(seq) >= MIN_VALID_FRAMES]
    if not sequences:
        return []

    resampled = [resample_sequence(seq, TARGET_FRAMES) for seq in sequences]
    averaged: list[dict[str, Any]] = []

    for frame_i in range(TARGET_FRAMES):
        frame_data: dict[str, Any] = {}
        for key in KEYS:
            valid_frames = [
                seq[frame_i][key]
                for seq in resampled
                if frame_i < len(seq) and key in seq[frame_i] and seq[frame_i][key]
            ]
            if not valid_frames:
                continue

            landmark_count = min(len(points) for points in valid_frames)
            frame_data[key] = [
                {
                    "x": float(np.median([points[j]["x"] for points in valid_frames])),
                    "y": float(np.median([points[j]["y"] for points in valid_frames])),
                    "z": float(np.median([points[j]["z"] for points in valid_frames])),
                    "v": float(np.median([points[j].get("v", 0.0) for points in valid_frames])),
                }
                for j in range(landmark_count)
            ]
        averaged.append(frame_data)

    return averaged


print("Average functions ready")

# %% Cell 8 - Process all words with checkpoint/resume
if RESUME and CHECKPOINT_FILE.exists():
    with CHECKPOINT_FILE.open("r", encoding="utf-8") as file:
        combined: dict[str, list[dict[str, Any]]] = json.load(file)
    print("Loaded checkpoint words:", len(combined))
else:
    combined = {}

skipped: dict[str, str] = {}
quality_report: dict[str, Any] = {}
checkpoint_words = len(combined)
failed_video_count = 0

for word_dir in tqdm(word_dirs, desc="Processing word folders"):
    word_label = normalize_label(word_dir.name)
    if RESUME and word_label in combined:
        continue

    videos = list_videos(word_dir)
    videos = videos[:MAX_VIDEOS_PER_WORD]

    if not videos:
        skipped[word_label] = "no videos"
        continue

    sequences = []
    video_reports = []
    for video_path in videos:
        try:
            frames = extract_from_video(video_path)
            quality = sequence_quality(frames)
            video_reports.append({"video": video_path.name, **quality})
        except Exception as exc:
            failed_video_count += 1
            if VERBOSE:
                tqdm.write(f"Failed video {video_path}: {exc}")
            video_reports.append({"video": video_path.name, "error": str(exc)})
            continue

        quality = video_reports[-1]
        if len(frames) >= MIN_VALID_FRAMES and quality["hand_ratio"] >= MIN_HAND_FRAME_RATIO:
            sequences.append(frames)

    averaged = average_sequences(sequences)
    quality_report[word_label] = {
        "used_sequences": len(sequences),
        "videos_checked": len(videos),
        "videos": video_reports,
    }

    if averaged:
        combined[word_label] = averaged
    else:
        skipped[word_label] = "no usable landmark sequences"

    if CHECKPOINT_EVERY > 0 and len(combined) - checkpoint_words >= CHECKPOINT_EVERY:
        with CHECKPOINT_FILE.open("w", encoding="utf-8") as file:
            json.dump(combined, file)
        tqdm.write(f"Checkpoint saved: {len(combined)} words")
        checkpoint_words = len(combined)

with CHECKPOINT_FILE.open("w", encoding="utf-8") as file:
    json.dump(combined, file)

print("Generated words:", len(combined))
print("Skipped words:", len(skipped))
print("Failed videos:", failed_video_count)
print("First generated:", list(combined.keys())[:20])

# %% Cell 9 - Save output files
OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

with OUTPUT_FILE.open("w", encoding="utf-8") as file:
    json.dump(combined, file)

report_path = OUTPUT_FILE.with_suffix(".report.json")
with report_path.open("w", encoding="utf-8") as file:
    json.dump(
        {
            "dataset_root": str(dataset_root),
            "output_file": str(OUTPUT_FILE),
            "word_count": len(combined),
            "skipped_count": len(skipped),
            "skipped": skipped,
            "quality": quality_report,
            "config": {
                "max_words": MAX_WORDS,
                "max_videos_per_word": MAX_VIDEOS_PER_WORD,
                "target_frames": TARGET_FRAMES,
                "frame_stride": FRAME_STRIDE,
                "max_source_frames": MAX_SOURCE_FRAMES,
                "min_valid_frames": MIN_VALID_FRAMES,
                "min_hand_frame_ratio": MIN_HAND_FRAME_RATIO,
                "pose_model_complexity": POSE_MODEL_COMPLEXITY,
            },
        },
        file,
        indent=2,
    )

print("Saved:", OUTPUT_FILE)
print("Saved:", report_path)
print("Output size MB:", round(OUTPUT_FILE.stat().st_size / (1024 * 1024), 2))

# %% Cell 10 - Download links in Kaggle
try:
    from IPython.display import FileLink, display

    display(FileLink(str(OUTPUT_FILE)))
    display(FileLink(str(report_path)))
except Exception:
    print("Download from the Kaggle Output panel:", OUTPUT_FILE)

"""
Generate combined_avg_landmarks.json on Kaggle for Text-to-Sign-Convertor.

Expected dataset layout, matching the screenshot:

  /kaggle/input/<dataset-name>/dataset/SL/<word>/<number>.mp4

Example:

  /kaggle/input/sign-language-dataset-wlasl-videos/dataset/SL/a/01610.mp4
  /kaggle/input/sign-language-dataset-wlasl-videos/dataset/SL/a lot/12345.mp4

Kaggle usage:

  1. In the notebook, install dependencies:
     !pip install mediapipe opencv-python-headless scipy tqdm

  2. Upload/copy this file into the notebook, or paste it into a cell.

  3. Run:
     !python kaggle_generate_combined_landmarks.py

  4. Download:
     /kaggle/working/combined_avg_landmarks.json

Optional environment variables:

  DATASET_ROOT=/kaggle/input/.../dataset/SL
  OUTPUT_FILE=/kaggle/working/combined_avg_landmarks.json
  MAX_WORDS=100
  MAX_VIDEOS_PER_WORD=5
  USE_FACE=0
  TARGET_FRAMES=32
  WORDS="a,a lot,abdomen,able,about,above,accent,accept,accident,accomplish"
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any


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
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-q", *missing],
        )


ensure_packages()

import cv2  # noqa: E402
import numpy as np  # noqa: E402
from scipy.interpolate import interp1d  # noqa: E402
from tqdm import tqdm  # noqa: E402


def load_mediapipe_solutions():
    try:
        import mediapipe as mp

        if (
            hasattr(mp, "solutions")
            and hasattr(mp.solutions, "pose")
            and hasattr(mp.solutions, "hands")
        ):
            return mp.solutions.pose, mp.solutions.hands
    except Exception:
        pass

    try:
        from mediapipe.python.solutions import hands, pose

        return pose, hands
    except Exception:
        pass

    print("Installing a MediaPipe build with Pose and Hands solutions...")
    subprocess.check_call(
        [
            sys.executable,
            "-m",
            "pip",
            "install",
            "-q",
            "mediapipe",
        ],
    )

    import importlib

    importlib.invalidate_caches()
    import mediapipe as mp

    if (
        hasattr(mp, "solutions")
        and hasattr(mp.solutions, "pose")
        and hasattr(mp.solutions, "hands")
    ):
        return mp.solutions.pose, mp.solutions.hands

    from mediapipe.python.solutions import hands, pose

    return pose, hands


mp_pose, mp_hands = load_mediapipe_solutions()


KAGGLE_INPUT = Path("/kaggle/input")
OUTPUT_FILE = Path(os.environ.get("OUTPUT_FILE", "/kaggle/working/combined_avg_landmarks.json"))
VIDEO_EXTS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}

MAX_WORDS = int(os.environ["MAX_WORDS"]) if os.environ.get("MAX_WORDS") else None
MAX_VIDEOS_PER_WORD = int(os.environ.get("MAX_VIDEOS_PER_WORD", "5"))
TARGET_FRAMES = int(os.environ.get("TARGET_FRAMES", "32"))
SELECTED_WORDS = [
    word.strip().lower()
    for word in os.environ.get(
        "WORDS",
        "a,a lot,abdomen,able,about,above,accent,accept,accident,accomplish",
    ).split(",")
    if word.strip()
]

USE_POSE = os.environ.get("USE_POSE", "1") != "0"
USE_HANDS = os.environ.get("USE_HANDS", "1") != "0"
USE_FACE = os.environ.get("USE_FACE", "0") != "0"

KEYS = ["pose", "left_hand", "right_hand", "face"]


def normalize_label(folder_name: str) -> str:
    return folder_name.strip().lower().replace("_", " ")


def find_dataset_root() -> Path:
    configured = os.environ.get("DATASET_ROOT")
    if configured:
        root = Path(configured)
        if not root.exists():
            raise FileNotFoundError(f"DATASET_ROOT does not exist: {root}")
        return root

    candidates = []
    for path in KAGGLE_INPUT.rglob("*"):
        if not path.is_dir():
            continue
        child_dirs = [child for child in path.iterdir() if child.is_dir()]
        if not child_dirs:
            continue
        mp4_count = 0
        for child in child_dirs[:20]:
            mp4_count += sum(1 for file in child.iterdir() if file.suffix.lower() in VIDEO_EXTS)
        if mp4_count > 0:
            candidates.append((mp4_count, path))

    if not candidates:
        raise FileNotFoundError(
            "Could not find a dataset root with word folders containing videos under /kaggle/input."
        )

    candidates.sort(reverse=True, key=lambda item: item[0])
    return candidates[0][1]


def landmark_list(landmarks: Any, include_visibility: bool = False) -> list[dict[str, float]]:
    output = []
    for landmark in landmarks.landmark:
        point = {
            "x": float(landmark.x),
            "y": float(landmark.y),
            "z": float(landmark.z),
        }
        if include_visibility:
            point["v"] = float(getattr(landmark, "visibility", 0.0))
        output.append(point)
    return output


def assign_hands(results: Any) -> dict[str, list[dict[str, float]]]:
    assigned: dict[str, list[dict[str, float]]] = {}
    if not results.multi_hand_landmarks:
        return assigned

    for index, hand_landmarks in enumerate(results.multi_hand_landmarks):
        label = ""
        if results.multi_handedness and index < len(results.multi_handedness):
            label = results.multi_handedness[index].classification[0].label.lower()

        # MediaPipe labels are from the detected person's perspective. For a
        # mirrored webcam-style source this can be visually inverted, but the
        # Text-to-Sign renderer only needs a stable left/right channel.
        key = "left_hand" if label == "left" else "right_hand"
        if key in assigned:
            key = "right_hand" if key == "left_hand" else "left_hand"
        assigned[key] = landmark_list(hand_landmarks)

    return assigned


def extract_from_video(video_path: Path) -> list[dict[str, Any]]:
    frames: list[dict[str, Any]] = []
    pose_detector = (
        mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        if USE_POSE
        else None
    )
    hand_detector = (
        mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            model_complexity=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        if USE_HANDS
        else None
    )

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"Warning: cannot open video: {video_path}")
        if pose_detector:
            pose_detector.close()
        if hand_detector:
            hand_detector.close()
        return frames

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame_data: dict[str, Any] = {}

        if pose_detector:
            pose_results = pose_detector.process(rgb)
            if pose_results.pose_landmarks:
                frame_data["pose"] = landmark_list(
                    pose_results.pose_landmarks,
                    include_visibility=True,
                )

        if hand_detector:
            hand_results = hand_detector.process(rgb)
            frame_data.update(assign_hands(hand_results))

        if frame_data:
            frames.append(frame_data)

    cap.release()
    if pose_detector:
        pose_detector.close()
    if hand_detector:
        hand_detector.close()
    return frames


def resample_sequence(sequence: list[dict[str, Any]], target_len: int) -> list[dict[str, Any]]:
    if len(sequence) == target_len:
        return sequence
    if len(sequence) < 2:
        return sequence

    old_index = np.linspace(0, 1, len(sequence))
    new_index = np.linspace(0, 1, target_len)
    output: list[dict[str, Any]] = []

    for frame_i in range(target_len):
        output.append({})

    for key in KEYS:
        first = next((frame[key] for frame in sequence if key in frame and frame[key]), None)
        if not first:
            continue

        landmark_count = len(first)
        for landmark_i in range(landmark_count):
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
    sequences = [seq for seq in sequences if len(seq) >= 2]
    if not sequences:
        return []

    target_len = TARGET_FRAMES
    resampled = [resample_sequence(seq, target_len) for seq in sequences]
    averaged: list[dict[str, Any]] = []

    for frame_i in range(target_len):
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
            frame_data[key] = []
            for landmark_i in range(landmark_count):
                frame_data[key].append(
                    {
                        "x": float(np.mean([points[landmark_i]["x"] for points in valid_frames])),
                        "y": float(np.mean([points[landmark_i]["y"] for points in valid_frames])),
                        "z": float(np.mean([points[landmark_i]["z"] for points in valid_frames])),
                        "v": float(np.mean([points[landmark_i].get("v", 0.0) for points in valid_frames])),
                    }
                )
        averaged.append(frame_data)

    return averaged


def main() -> None:
    dataset_root = find_dataset_root()
    print(f"Dataset root: {dataset_root}")
    print(f"Output file: {OUTPUT_FILE}")
    print(f"USE_FACE={USE_FACE}, TARGET_FRAMES={TARGET_FRAMES}")
    print(f"MAX_WORDS={MAX_WORDS}, MAX_VIDEOS_PER_WORD={MAX_VIDEOS_PER_WORD}")
    print(f"WORDS={SELECTED_WORDS if SELECTED_WORDS else 'all'}")

    word_dirs = sorted([path for path in dataset_root.iterdir() if path.is_dir()], key=lambda p: p.name)
    if SELECTED_WORDS:
        selected = set(SELECTED_WORDS)
        word_dirs = [path for path in word_dirs if normalize_label(path.name) in selected]
        found = {normalize_label(path.name) for path in word_dirs}
        missing = [word for word in SELECTED_WORDS if word not in found]
        if missing:
            print(f"Warning: selected words not found: {missing}")

    if MAX_WORDS:
        word_dirs = word_dirs[:MAX_WORDS]

    combined: dict[str, list[dict[str, Any]]] = {}
    skipped: dict[str, str] = {}

    for word_dir in tqdm(word_dirs, desc="Processing word folders"):
        videos = sorted(
            [path for path in word_dir.iterdir() if path.suffix.lower() in VIDEO_EXTS],
            key=lambda p: p.name,
        )
        if MAX_VIDEOS_PER_WORD:
            videos = videos[:MAX_VIDEOS_PER_WORD]

        if not videos:
            skipped[word_dir.name] = "no videos"
            continue

        sequences = []
        for video_path in videos:
            frames = extract_from_video(video_path)
            if frames:
                sequences.append(frames)

        averaged = average_sequences(sequences)
        if averaged:
            combined[normalize_label(word_dir.name)] = averaged
        else:
            skipped[word_dir.name] = "no landmarks extracted"

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
            },
            file,
            indent=2,
        )

    print(f"Saved combined landmarks: {OUTPUT_FILE}")
    print(f"Saved report: {report_path}")
    print(f"Generated words: {len(combined)}")
    print(f"Skipped words: {len(skipped)}")


if __name__ == "__main__":
    main()

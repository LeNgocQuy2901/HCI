import json
import os

import numpy as np
from scipy.interpolate import interp1d
from tqdm import tqdm


# === CONFIGURATION ===
START_FROM_WORD = "clock"
DATA_ROOT = os.path.join(os.path.dirname(__file__), "../data")
KEYS = ["pose", "left_hand", "right_hand", "face"]


def interpolate_sequence(seq, key, target_len):
    interpolated = []

    for frame in seq:
        if key in frame and frame[key] is not None:
            num_landmarks = len(frame[key])
            break
    else:
        return []

    for i in range(num_landmarks):
        x_vals, y_vals, z_vals, v_vals, valid_indices = [], [], [], [], []

        for t, frame in enumerate(seq):
            if key in frame and frame[key] and i < len(frame[key]):
                point = frame[key][i]
                x_vals.append(point["x"])
                y_vals.append(point["y"])
                z_vals.append(point["z"])
                v_vals.append(point.get("v", 0.0))
                valid_indices.append(t)

        if len(valid_indices) < 2:
            continue

        old_t = np.linspace(0, 1, len(valid_indices))
        new_t = np.linspace(0, 1, target_len)

        fx = interp1d(old_t, x_vals, kind="linear")
        fy = interp1d(old_t, y_vals, kind="linear")
        fz = interp1d(old_t, z_vals, kind="linear")
        fv = interp1d(old_t, v_vals, kind="linear")

        interp_points = [
            {"x": float(x), "y": float(y), "z": float(z), "v": float(v)}
            for x, y, z, v in zip(fx(new_t), fy(new_t), fz(new_t), fv(new_t))
        ]
        interpolated.append(interp_points)

    return [[landmark[i] for landmark in interpolated] for i in range(target_len)]


def process_word_folder(word_folder):
    base_path = os.path.join(DATA_ROOT, word_folder)
    all_sequences = []

    for file_name in os.listdir(base_path):
        if file_name.endswith("_landmarks.json"):
            with open(os.path.join(base_path, file_name), encoding="utf-8") as file:
                try:
                    all_sequences.append(json.load(file))
                except json.JSONDecodeError as exc:
                    print(f"JSON decode error in {file_name}: {exc}")
                    return

    if len(all_sequences) < 2:
        print(f"Not enough videos for '{word_folder}', skipping.")
        return

    min_len = min(len(seq) for seq in all_sequences)
    interpolated_per_key = {key: [] for key in KEYS}

    for seq in all_sequences:
        for key in KEYS:
            interpolated_per_key[key].append(interpolate_sequence(seq, key, min_len))

    averaged = []
    for frame_i in range(min_len):
        frame_data = {}
        for key in KEYS:
            if not all(interpolated_per_key[key]):
                continue
            try:
                num_landmarks = len(interpolated_per_key[key][0][frame_i])
                frame_data[key] = [
                    {
                        "x": float(
                            np.mean(
                                [seq[frame_i][j]["x"] for seq in interpolated_per_key[key]]
                            )
                        ),
                        "y": float(
                            np.mean(
                                [seq[frame_i][j]["y"] for seq in interpolated_per_key[key]]
                            )
                        ),
                        "z": float(
                            np.mean(
                                [seq[frame_i][j]["z"] for seq in interpolated_per_key[key]]
                            )
                        ),
                        "v": float(
                            np.mean(
                                [
                                    seq[frame_i][j].get("v", 0.0)
                                    for seq in interpolated_per_key[key]
                                ]
                            )
                        ),
                    }
                    for j in range(num_landmarks)
                ]
            except Exception as exc:
                print(f"Error processing frame {frame_i} in key '{key}': {exc}")
        averaged.append(frame_data)

    out_path = os.path.join(base_path, f"{word_folder}_average_landmarks.json")
    with open(out_path, "w", encoding="utf-8") as file:
        json.dump(averaged, file)
    print(f"Averaged landmarks saved: {out_path}")


if __name__ == "__main__":
    all_folders = sorted(
        [
            folder
            for folder in os.listdir(DATA_ROOT)
            if os.path.isdir(os.path.join(DATA_ROOT, folder))
        ]
    )
    start_index = all_folders.index(START_FROM_WORD) if START_FROM_WORD in all_folders else 0

    print(f"Starting processing from '{all_folders[start_index]}'...")

    for word_folder in tqdm(all_folders[start_index:], desc="Processing Words"):
        try:
            process_word_folder(word_folder)
        except Exception as exc:
            print(f"Error processing {word_folder}: {exc}")

    print("\nAll averaging complete.")

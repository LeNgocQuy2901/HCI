# Legacy Bidirectional Sign Language Converters

This folder keeps the original converter code used as reference material for
the current application.

## Text-to-Sign Convertor

`Text-to-Sign-Convertor/` converts text into landmark animation data.

Current useful files:

```text
Text-to-Sign-Convertor/
  avatar/
    avatar.glb
    main.js
  data/
    combined_avg_landmarks.json
  scripts/
    extract_landmarks.py
    average_landmarks.py
    play_landmark_animation.py
  combineAllJson.py
  test.py
```

Typical pipeline:

```bash
cd Text-to-Sign-Convertor/scripts
python extract_landmarks.py
python average_landmarks.py
cd ..
python combineAllJson.py
python test.py
```

The current web app can consume `data/combined_avg_landmarks.json` for
landmark-based Text-to-Sign rendering.

## Sign-to-Text Convertor

`Sign-to-Text-Convertor/` contains the original model notebooks and trained
gesture classifier assets used as reference for the Sign-to-Text side.

Useful files include:

```text
Sign-to-Text-Convertor/
  model.ipynb
  predict.ipynb
  gesture_model.h5
  gesture_mapping.json
```

## Notes

- Duplicate/stale reports and unused optional files were removed.
- `convert_to_rotations.py` was removed because it duplicated
  `average_landmarks.py` and did not implement rotation conversion.
- `average_landmarks.py` is now the single script for averaging extracted
  landmark sequences.

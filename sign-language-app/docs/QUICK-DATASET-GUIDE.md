# Quick Reference: Dataset Integration

## Files Created/Modified

### New Files
1. **ml-service/utils/dataset_loader.py** - Loads and prepares dataset
2. **ml-service/utils/model_trainer.py** - Complete training pipeline
3. **ml-service/train.sh** - Linux/Mac training script
4. **ml-service/train.bat** - Windows training script
5. **docs/DATASET-TRAINING.md** - Comprehensive training guide

### Modified Files
1. **ml-service/__main__.py** - Added training/evaluation modes
2. **ml-service/utils/__init__.py** - Export new classes

## Quick Commands

### Windows
```batch
# Open Command Prompt in ml-service folder and run:
train.bat
train.bat 100 16  # Custom epochs and batch size
```

### Linux/Mac
```bash
# Open Terminal in ml-service folder and run:
chmod +x train.sh
./train.sh
./train.sh 100 16  # Custom epochs and batch size
```

### Manual (Any OS)
```bash
cd sign-language-app/ml-service
python -m __main__ --train --dataset ../../datasetTTNM --epochs 50 --batch-size 32 --augment
```

## What Gets Trained

- **37 gesture classes**: 0-9, A-Z, _
- **224x224 images** from datasetTTNM
- **Both raw and pre-processed** data supported
- **Data augmentation** with rotation, brightness, blur
- **Automatic train/val/test** split (80/10/10)

## Training Output

After training completes:
- ✅ `models/best_model.h5` - Best trained model
- ✅ `models/gesture_model_YYYYMMDD_HHMMSS.h5` - Model checkpoint
- ✅ `models/metadata_YYYYMMDD_HHMMSS.json` - Training stats

## Using Trained Model

```python
from gesture_recognizer import GestureRecognizer
import cv2

recognizer = GestureRecognizer(model_path="models/best_model.h5")
frame = cv2.imread("test.jpg")
gesture, confidence = recognizer.recognize_gesture(frame)
print(f"{gesture}: {confidence:.2%}")
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Dataset not found | Check path: `d:\GitHub\HCL\datasetTTNM` |
| Out of memory | Use `--max-images 50` or reduce `--batch-size` |
| Training slow | Increase `--batch-size` or enable GPU |
| No improvement | Try `--augment` or increase `--epochs` |

## Dataset Structure

```
datasetTTNM/
├── Gesture Image Data/ ............... Raw images
└── Gesture Image Pre-Processed Data/  Pre-processed images
```

Each contains folders: `0, 1, 2, ..., 9, A, B, ..., Z, _`

## Features

✅ Automatic dataset loading and validation
✅ Image preprocessing (resize, normalize)
✅ Data augmentation (rotation, brightness, blur)
✅ Train/val/test splitting with stratification
✅ Early stopping and learning rate scheduling
✅ Model checkpointing (saves best model)
✅ Automatic metadata logging
✅ Batch processing support
✅ GPU support with TensorFlow

## Next Step

Run training:
```
cd d:\GitHub\HCL\sign-language-app\ml-service
train.bat
```

Monitor output for training progress. Training typically takes 5-30 minutes depending on dataset size and hardware.

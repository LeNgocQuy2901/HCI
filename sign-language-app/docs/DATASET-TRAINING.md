# Dataset Integration & Model Training Guide

## Overview

This guide explains how to integrate the `datasetTTNM` gesture dataset with the ML model training pipeline. The system supports training a CNN model for gesture recognition on all gesture labels (0-9, A-Z, _).

## Dataset Structure

The dataset is organized in the following structure:

```
datasetTTNM/
├── Gesture Image Data/              # Raw original images
│   ├── 0/, 1/, 2/, ..., 9/
│   ├── A/, B/, C/, ..., Z/
│   └── _/
└── Gesture Image Pre-Processed Data/ # Pre-processed images
    ├── 0/, 1/, 2/, ..., 9/
    ├── A/, B/, C/, ..., Z/
    └── _/
```

Each folder contains gesture images for that label (e.g., `0/` contains images for digit 0, `A/` contains images for letter A, etc.).

## Quick Start

### 1. Train Model on Full Dataset

```bash
cd sign-language-app/ml-service

# Train with default parameters
python -m __main__ --train --dataset ../../datasetTTNM

# With custom parameters
python -m __main__ --train \
    --dataset ../../datasetTTNM \
    --epochs 100 \
    --batch-size 16 \
    --lr 0.001 \
    --augment
```

### 2. Train with Limited Data (Testing)

```bash
# Train with only 10 images per label for quick testing
python -m __main__ --train \
    --dataset ../../datasetTTNM \
    --max-images 10 \
    --epochs 5
```

### 3. Use Pre-processed Data

The training script automatically uses pre-processed images from `Gesture Image Pre-Processed Data/`. Set `use_preprocessed=False` to use raw images.

### 4. Evaluate Trained Model

```bash
python -m __main__ --evaluate \
    --dataset ../../datasetTTNM \
    --model models/best_model.h5
```

### 5. Run Inference (Default)

```bash
python -m __main__
```

## Training Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--epochs` | 50 | Number of training epochs |
| `--batch-size` | 32 | Batch size for training |
| `--lr` | 0.001 | Learning rate for optimizer |
| `--augment` | False | Enable data augmentation |
| `--max-images` | None | Max images per label (None = all) |

## Key Features

### 1. Automatic Dataset Loading
```python
from utils import DatasetLoader

loader = DatasetLoader("../../datasetTTNM", use_preprocessed=True)
X, y = loader.load_dataset(
    image_size=(224, 224),
    max_images_per_label=None,
    augment=False
)
```

### 2. Data Augmentation
Includes:
- Random rotation (-15° to +15°)
- Random brightness adjustment (0.8x to 1.2x)
- Random Gaussian blur

### 3. Train/Val/Test Splitting
- Training: 80% of data
- Validation: 10% during training
- Test: 10% for final evaluation
- Stratified splitting to preserve label distribution

### 4. Model Architecture
CNN with:
- 3 convolutional blocks with batch normalization
- Max pooling and dropout for regularization
- 2 fully connected layers with dropout
- Softmax output for 37 gesture classes

### 5. Training Features
- ModelCheckpoint: Saves best model based on validation accuracy
- EarlyStopping: Stops if no improvement for 5 epochs
- ReduceLROnPlateau: Reduces learning rate if val_loss plateaus
- Automatic metadata logging

## Output Files

Training creates the following files in `ml-service/models/`:

1. **best_model.h5** - Best model during training
2. **gesture_model_YYYYMMDD_HHMMSS.h5** - Final model checkpoint
3. **metadata_YYYYMMDD_HHMMSS.json** - Training metadata

Example metadata:
```json
{
  "timestamp": "20260401_143022",
  "model_path": "models/gesture_model_20260401_143022.h5",
  "use_preprocessed_data": true,
  "training_config": {
    "epochs": 50,
    "batch_size": 32,
    "learning_rate": 0.001
  },
  "dataset_info": {
    "num_classes": 37,
    "input_shape": [224, 224, 3],
    "labels": ["0", "1", ..., "Z", "_"],
    "split_sizes": {
      "train": 12000,
      "val": 1500,
      "test": 1500
    }
  },
  "results": {
    "test_loss": 0.1234,
    "test_accuracy": 0.9567,
    "training_history": {
      "epochs": 50,
      "final_train_loss": 0.0456,
      "final_train_accuracy": 0.9876,
      "final_val_loss": 0.1123,
      "final_val_accuracy": 0.9567
    }
  }
}
```

## Python API Usage

### Training with Custom Configuration

```python
from utils import GestureModelTrainer

trainer = GestureModelTrainer(
    dataset_path="../../datasetTTNM",
    model_output_dir="models",
    use_preprocessed=True
)

results = trainer.train(
    epochs=100,
    batch_size=16,
    validation_split=0.1,
    augment=True,
    max_images_per_label=None,
    learning_rate=0.001,
    save_best=True
)

print(f"Test Accuracy: {results['results']['test_accuracy']:.4f}")
```

### Loading and Using Dataset

```python
from utils import DatasetLoader

loader = DatasetLoader("../../datasetTTNM", use_preprocessed=True)

# Load full dataset
X, y = loader.load_dataset()

# Split into train/val/test
X_train, X_val, X_test, y_train, y_val, y_test = \
    loader.split_dataset(X, y, test_size=0.1, val_size=0.1)

# Get label distribution
distribution = loader.get_label_distribution(y)
print(distribution)
```

### Data Preprocessing

```python
from utils import DataPreprocessor

# Load image
image = DataPreprocessor.load_image("path/to/image.jpg")

# Process
image = DataPreprocessor.resize_image(image, (224, 224))
image = DataPreprocessor.normalize_image(image)

# Augment
augmented = DataPreprocessor.augment_image(image)
```

## Inference with Trained Model

```python
from gesture_recognizer import GestureRecognizer
import cv2

# Load recognizer with trained model
recognizer = GestureRecognizer(model_path="models/best_model.h5")

# Recognize gesture from image
frame = cv2.imread("test_image.jpg")
gesture, confidence = recognizer.recognize_gesture(frame)
print(f"Gesture: {gesture}, Confidence: {confidence:.2f}")
```

## Troubleshooting

### No Images Found
- Check that dataset path is correct: `d:\GitHub\HCL\datasetTTNM`
- Verify folder structure (0-9, A-Z, _)
- Ensure images are .jpg or .png format

### Out of Memory
- Reduce `--batch-size` (e.g., 8 or 16)
- Use `--max-images` to limit dataset
- Reduce `--epochs`

### Training Too Slow
- Use `--batch-size` 64 or higher
- Enable GPU acceleration (CUDA)
- Use pre-processed data (faster to load)

### Model Not Improving
- Increase `--epochs`
- Try `--augment` for data augmentation
- Adjust `--lr` (try 0.0001 or 0.01)
- Check `--max-images` isn't too small

## Performance Tips

1. **Use Pre-processed Data**: Faster loading and training
2. **Enable Augmentation**: Improves generalization
3. **Batch Processing**: Use reasonable batch sizes (16-64)
4. **GPU Training**: Use CUDA for 10x+ speedup
5. **Monitor Training**: Check validation accuracy progress

## Next Steps

1. Train model on full dataset: `python -m __main__ --train --dataset ../../datasetTTNM`
2. Monitor training progress in logs
3. Evaluate model: `python -m __main__ --evaluate --dataset ../../datasetTTNM --model models/best_model.h5`
4. Use trained model in inference
5. Deploy to backend API

## Support Files

- [ML Guide](./ML-GUIDE.md) - General ML service documentation
- [Development Guide](./DEVELOPMENT.md) - Development setup
- [API Documentation](./API.md) - Backend API reference

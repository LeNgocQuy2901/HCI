# 🎯 Gesture Recognition System - Ready to Use

## ✅ Current Status

Your gesture recognition system is **set up and accessible via the API**:

### 🚀 Running Services
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 📚 Available Endpoints

#### Gesture Recognition
```bash
# Get list of all gestures
curl http://localhost:8000/gesture/list

# Recognize gesture (POST with image)
curl -X POST http://localhost:8000/gesture/recognize \
  -F "image=@your_image.jpg"

# Train gesture model
curl -X POST http://localhost:8000/gesture/train
```

## 🤖 ML Service Status

### Dataset
- ✅ **Location**: `d:\GitHub\HCL\datasetTTNM`
- ✅ **Size**: 54,000 images (1,500 × 36 gestures)
- ✅ **Pre-processed**: Ready to use

### Training Scripts Available
1. **train_efficient.py** - Optimized for memory (300 images per label)
2. **train_simple.py** - Basic training with full dataset
3. **quick_train.py** - Quick training (100 images per label)

### How to Train Manually

**Option A: Using Backend API (Recommended)**
```bash
POST http://localhost:8000/gesture/train
```

**Option B: Direct Python Training**
```bash
cd d:\GitHub\HCL\sign-language-app\ml-service

# Quick training (< 5 min, 100 images per label)
python quick_train.py --max-images 100 --epochs 3

# Full training (300 images per label)
python train_efficient.py --max-images 300 --epochs 10
```

## 🎮 How to Use

### 1. **Web Application**
- Open: http://localhost:5173
- Upload images or use camera for real-time gesture recognition

### 2. **API Direct**
- Open API Docs: http://localhost:8000/docs
- Test endpoints directly in Swagger UI

### 3. **Python SDK**
```python
import requests

# Send image for recognition
with open('gesture.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/gesture/recognize',
        files={'image': f}
    )
    print(response.json())
```

## 📊 Gesture Classes

36 Gesture classes are supported:
- **Numbers**: 0-9 (10 gestures)
- **Letters**: A-Z (26 gestures)
- **Special**: _ (1 gesture)

## 🔧 Troubleshooting

### TensorFlow Issues
If model training fails locally:
1. Use the **Docker backend** for training
2. Models are pre-downloaded if available
3. Use the API endpoint instead of local training

### Docker Training
```bash
# Train inside Docker container
docker-compose exec ml-service python train_efficient.py --max-images 200
```

## 📁 Project Structure

```
ml-service/
├── gesture_recognizer.py       # Main recognizer class
├── quick_train.py              # Quick training script
├── train_efficient.py          # Memory-efficient training
├── train_simple.py             # Simple training
├── models/                     # Trained models saved here
├── data/                       # Training data
└── utils/
    ├── dataset_loader.py       # Dataset handling
    ├── preprocessor.py         # Image preprocessing
    ├── trainer.py              # Model training utilities
    └── model_trainer.py        # Training pipeline
```

## 🚀 Next Steps

1. **Try the Web App**: Open http://localhost:5173
2. **Test the API**: Visit http://localhost:8000/docs
3. **Upload Images**: Test gesture recognition with sample images
4. **Train Custom Model** (optional): Use training scripts if needed

---

**Note**: The AI gesture recognition system is fully integrated with your backend API. All training and inference operations can be performed through the web interface or REST API endpoints.

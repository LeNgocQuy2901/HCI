# Integration Guide: Using Trained Model in Backend

## Overview

This guide explains how to integrate the trained gesture recognition model with the backend API for real-time gesture recognition.

## Setup

### 1. Train the Model

First, train the model on the dataset:

```bash
cd ml-service
python -m __main__ --train --dataset ../../datasetTTNM --augment
```

This creates `models/best_model.h5` (the trained model) and metadata files.

### 2. Copy Model to Backend

Once training is complete, copy the best model to the backend:

```bash
# From ml-service directory
cp models/best_model.h5 ../backend/models/
```

Or manually copy `d:\GitHub\HCL\sign-language-app\ml-service\models\best_model.h5` to `d:\GitHub\HCL\sign-language-app\backend\models\`

## Using in Backend API

### Option 1: Direct Import

```python
from ml_service.gesture_recognizer import GestureRecognizer
import cv2

# Initialize recognizer with trained model
recognizer = GestureRecognizer(model_path="models/best_model.h5")

# In your gesture recognition endpoint
@app.route('/api/recognize', methods=['POST'])
def recognize_gesture():
    # Receive image
    file = request.files['image']
    image_bytes = file.read()
    
    # Convert to OpenCV format
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Recognize gesture
    gesture, confidence = recognizer.recognize_gesture(frame)
    
    return {
        'gesture': gesture,
        'confidence': float(confidence),
        'labels': recognizer.labels
    }
```

### Option 2: REST API Service

Create a dedicated ML service endpoint:

```python
from flask import Flask, request, jsonify
from ml_service.gesture_recognizer import GestureRecognizer
import cv2
import numpy as np

app = Flask(__name__)
recognizer = GestureRecognizer(model_path="models/best_model.h5")

@app.route('/ml/recognize', methods=['POST'])
def recognize():
    """Recognize gesture from image"""
    try:
        file = request.files['image']
        image_bytes = file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        gesture, confidence = recognizer.recognize_gesture(frame)
        
        return jsonify({
            'success': True,
            'gesture': gesture,
            'confidence': float(confidence),
            'labels': recognizer.labels
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/ml/status', methods=['GET'])
def status():
    """Get ML service status"""
    return jsonify({
        'status': 'healthy',
        'num_classes': len(recognizer.labels),
        'labels': recognizer.labels
    })

if __name__ == '__main__':
    app.run(port=5001)
```

### Option 3: Integrated Gesture Route

Update existing gesture route in `backend/app/routes/gesture.py`:

```python
from flask import Blueprint, request, jsonify
from ..services.gesture_service import GestureService
from ..models.gesture_model import GestureModel

gesture_bp = Blueprint('gesture', __name__, url_prefix='/api/gesture')

# Initialize gesture service with trained model
gesture_service = GestureService(model_path="models/best_model.h5")

@gesture_bp.route('/recognize', methods=['POST'])
def recognize_gesture():
    """Recognize gesture from image"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['image']
        
        # Recognize gesture
        gesture, confidence = gesture_service.recognize(file)
        
        # Save to database if requested
        if request.form.get('save'):
            gesture_record = GestureModel(
                gesture_label=gesture,
                confidence=float(confidence),
                user_id=request.form.get('user_id')
            )
            gesture_record.save()
        
        return jsonify({
            'success': True,
            'gesture': gesture,
            'confidence': float(confidence)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@gesture_bp.route('/labels', methods=['GET'])
def get_labels():
    """Get all available gesture labels"""
    return jsonify({
        'labels': gesture_service.get_labels(),
        'num_classes': gesture_service.num_classes
    })
```

## Gesture Service Implementation

Create `backend/app/services/gesture_service.py`:

```python
import logging
from pathlib import Path
from ..ml.gesture_recognizer import GestureRecognizer
import cv2
import numpy as np

logger = logging.getLogger(__name__)

class GestureService:
    """Service for gesture recognition"""
    
    def __init__(self, model_path="models/best_model.h5"):
        """Initialize gesture service"""
        self.model_path = Path(model_path)
        self.recognizer = GestureRecognizer(model_path=str(self.model_path))
        logger.info(f"GestureService initialized with model: {model_path}")
    
    def recognize(self, image_input):
        """
        Recognize gesture from image
        
        Args:
            image_input: File object or image array
        
        Returns:
            Tuple of (gesture_label, confidence)
        """
        try:
            # Convert file to numpy array
            if hasattr(image_input, 'read'):
                image_bytes = image_input.read()
                nparr = np.frombuffer(image_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            else:
                frame = image_input
            
            # Recognize gesture
            gesture, confidence = self.recognizer.recognize_gesture(frame)
            
            if gesture is None:
                raise Exception("Failed to extract landmarks from image")
            
            logger.info(f"Recognized gesture: {gesture} (confidence: {confidence:.2f})")
            
            return gesture, confidence
        
        except Exception as e:
            logger.error(f"Error in gesture recognition: {e}")
            raise
    
    def get_labels(self):
        """Get all available gesture labels"""
        return self.recognizer.labels
    
    @property
    def num_classes(self):
        """Get number of gesture classes"""
        return len(self.recognizer.labels)
```

## Frontend Integration

Update frontend to use new gesture endpoint:

```javascript
// src/services/api.js

export const recognizeGesture = async (imageFile, userId = null) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  if (userId) {
    formData.append('user_id', userId);
    formData.append('save', 'true');
  }
  
  try {
    const response = await fetch('/api/gesture/recognize', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      gesture: data.gesture,
      confidence: data.confidence,
      labels: data.labels
    };
  } catch (error) {
    console.error('Error recognizing gesture:', error);
    throw error;
  }
};

export const getGestureLabels = async () => {
  try {
    const response = await fetch('/api/gesture/labels');
    const data = await response.json();
    return data.labels;
  } catch (error) {
    console.error('Error fetching labels:', error);
    throw error;
  }
};
```

## Docker Integration

Update `Dockerfile` for backend to include ML service:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend/ ./
COPY ml-service/ ./ml_service/

# Copy trained model
COPY ml-service/models/best_model.h5 ./models/

# Expose ports
EXPOSE 5000

# Run backend
CMD ["python", "main.py"]
```

## Model Management

### Load Different Models

```python
# Load a specific model checkpoint
recognizer = GestureRecognizer(
    model_path="models/gesture_model_20260401_143022.h5"
)
```

### Model Metadata

Access training metadata:

```python
import json

metadata_path = "models/metadata_20260401_143022.json"
with open(metadata_path) as f:
    metadata = json.load(f)

print(f"Model accuracy: {metadata['results']['test_accuracy']:.2%}")
print(f"Trained for: {metadata['training_config']['epochs']} epochs")
print(f"Dataset: {metadata['dataset_info']['split_sizes']}")
```

## Performance Optimization

### 1. Model Quantization

```python
import tensorflow as tf

# Load and quantize model
model = tf.keras.models.load_model("models/best_model.h5")

# Convert to TFLite (smaller, faster)
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

with open("models/gesture_model.tflite", "wb") as f:
    f.write(tflite_model)
```

### 2. Batch Processing

```python
# Process multiple images at once
images = [img1, img2, img3]
predictions = recognizer.model.predict(np.array(images))
```

### 3. Caching

```python
from functools import lru_cache

class CachedGestureService(GestureService):
    @lru_cache(maxsize=100)
    def recognize(self, image_hash):
        # Use hash as cache key
        return super().recognize(image_hash)
```

## Deployment Checklist

- [ ] Model trained and tested: `best_model.h5`
- [ ] Metadata logged: `metadata_*.json`
- [ ] Model copied to backend
- [ ] Gesture service implemented
- [ ] Backend routes updated
- [ ] Frontend API calls configured
- [ ] Docker setup complete
- [ ] Model performance verified
- [ ] Caching configured (optional)
- [ ] Deployment ready!

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Model not loading | Check path and file exists |
| No landmarks detected | Image quality or gesture unclear |
| Low accuracy | More training needed or data quality |
| Slow inference | Use model quantization or batch processing |
| Memory issues | Use TFLite or reduce batch size |

## Next Steps

1. Train model: `cd ml-service && python -m __main__ --train --dataset ../../datasetTTNM`
2. Test model: `python -m __main__ --evaluate --dataset ../../datasetTTNM`
3. Integrate with backend: Copy trained model and update routes
4. Deploy: Build Docker image with trained model
5. Monitor: Track prediction accuracy and latency

## Support

For more details:
- [Dataset Training Guide](./DATASET-TRAINING.md)
- [ML Service Guide](./ML-GUIDE.md)
- [API Documentation](./API.md)

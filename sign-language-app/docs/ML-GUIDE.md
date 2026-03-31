# 🤖 Machine Learning Guide

**Nhận Diện Ký Hiệu - ML Pipeline Hoàn Chỉnh**

---

## 📋 Mục Lục

1. [Giới Thiệu](#giới-thiệu)
2. [Dataset Preparation](#dataset-preparation)
3. [Model Architecture](#model-architecture)
4. [Training](#training)
5. [Evaluation](#evaluation)
6. [Deployment](#deployment)
7. [Real-time Recognition](#real-time-recognition)
8. [Model Optimization](#model-optimization)

---

## 🎯 Giới Thiệu

### Mục Tiêu
Xây dựng ML model nhận diện **36 gestures** (0-9, A-Z, _) từ:
- **Input:** Video/Image từ camera thời gian thực
- **Output:** Gesture label + confidence score
- **Accuracy Target:** 90%+

### Workflow
```
Raw Images
    ↓
Preprocessing (Crop, Resize, Normalize)
    ↓
Hand Detection (MediaPipe)
    ↓
Landmark Extraction (21 points/hand)
    ↓
ML Model (TensorFlow/PyTorch)
    ↓
Classification (36 gestures)
    ↓
Post-processing
    ↓
Real-time Display
```

### Technology Stack
- **Hand Detection:** MediaPipe Hands
- **Framework:** TensorFlow/Keras
- **Preprocessing:** OpenCV, NumPy
- **Metrics:** scikit-learn
- **GPU:** NVIDIA CUDA (optional)

---

## 📊 Dataset Preparation

### Dataset Structure

Sử dụng dataset TTNM có sẵn:
```
datasetTTNM/
├── Gesture Image Data/
│   ├── 0/ (100+ images)
│   ├── 1/ (100+ images)
│   ├── ...
│   ├── 9/ (100+ images)
│   ├── A/ (100+ images)
│   ├── B/ (100+ images)
│   └── ... (A-Z + _)
└── Gesture Image Pre-Processed Data/
    ├── 0/
    ├── 1/
    └── ...
```

### Preprocessing Pipeline

**File:** `ml-service/utils/preprocessor.py`

```python
import cv2
import numpy as np
import mediapipe as mp
from pathlib import Path

class GesturePreprocessor:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=True,
            max_num_hands=1,
            min_detection_confidence=0.5
        )
    
    def extract_landmarks(self, image_path):
        """
        Extract hand landmarks from image
        Returns: Array of 63 values (21 points × 3 coordinates)
        """
        image = cv2.imread(image_path)
        if image is None:
            return None
        
        # Convert to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Detect hands
        results = self.hands.process(rgb_image)
        
        if not results.multi_hand_landmarks:
            return None
        
        # Extract landmarks
        landmarks = []
        for landmark in results.multi_hand_landmarks[0].landmark:
            landmarks.extend([landmark.x, landmark.y, landmark.z])
        
        return np.array(landmarks)
    
    def load_dataset(self, dataset_path, labels):
        """
        Load entire dataset
        Returns: X (features), y (labels)
        """
        X, y = [], []
        
        for label_idx, label in enumerate(labels):
            label_path = Path(dataset_path) / label
            
            for image_file in label_path.glob('*.jpg'):
                landmarks = self.extract_landmarks(str(image_file))
                
                if landmarks is not None:
                    X.append(landmarks)
                    y.append(label_idx)
        
        return np.array(X), np.array(y)
    
    def normalize_features(self, X):
        """Normalize features to 0-1 range"""
        X_min = X.min(axis=0)
        X_max = X.max(axis=0)
        return (X - X_min) / (X_max - X_min + 1e-8)
    
    def augment_data(self, X, y, factor=2):
        """
        Data augmentation bằng random noise
        """
        X_augmented = [X]
        y_augmented = [y]
        
        for _ in range(factor - 1):
            noise = np.random.normal(0, 0.01, X.shape)
            X_augmented.append(X + noise)
            y_augmented.append(y)
        
        return np.vstack(X_augmented), np.hstack(y_augmented)
```

### Prepare Data for Training

**File:** `ml-service/prepare_data.py`

```python
from utils.preprocessor import GesturePreprocessor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import numpy as np

# Define labels
LABELS = list(map(str, range(10))) + list('ABCDEFGHIJKLMNOPQRSTUVWXYZ') + ['_']

# Initialize preprocessor
preprocessor = GesturePreprocessor()

# Load dataset
print("Loading dataset...")
X, y = preprocessor.load_dataset(
    'data/raw/Gesture Image Data',
    LABELS
)

print(f"Loaded {X.shape[0]} samples with {X.shape[1]} features")

# Normalize
print("Normalizing features...")
X = preprocessor.normalize_features(X)

# Data augmentation
print("Augmenting data...")
X, y = preprocessor.augment_data(X, y, factor=3)

# Convert labels to one-hot encoding
from tensorflow.keras.utils import to_categorical
y_categorical = to_categorical(y, num_classes=len(LABELS))

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y_categorical,
    test_size=0.2,
    random_state=42,
    stratify=np.argmax(y_categorical, axis=1)
)

# Save
print("Saving prepared data...")
np.save('data/processed/X_train.npy', X_train)
np.save('data/processed/X_test.npy', X_test)
np.save('data/processed/y_train.npy', y_train)
np.save('data/processed/y_test.npy', y_test)

print(f"Training set: {X_train.shape}")
print(f"Test set: {X_test.shape}")
```

**Run:**
```bash
cd ml-service
python prepare_data.py
```

---

## 🧠 Model Architecture

### Option 1: Simple Dense Neural Network

```python
from tensorflow.keras import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization
from tensorflow.keras.optimizers import Adam

def build_simple_model(input_shape=63, num_classes=36):
    """
    Simple feedforward neural network
    Parameters: ~200K
    """
    model = Sequential([
        Dense(256, activation='relu', input_shape=(input_shape,)),
        BatchNormalization(),
        Dropout(0.3),
        
        Dense(128, activation='relu'),
        BatchNormalization(),
        Dropout(0.3),
        
        Dense(64, activation='relu'),
        Dropout(0.2),
        
        Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model
```

### Option 2: LSTM (Sequence Processing)

```python
from tensorflow.keras import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

def build_lstm_model(input_shape=(10, 63), num_classes=36):
    """
    LSTM for sequence of hand positions
    Good for smoothing predictions over frames
    """
    model = Sequential([
        LSTM(128, activation='relu', input_shape=input_shape, return_sequences=True),
        Dropout(0.2),
        
        LSTM(64, activation='relu'),
        Dropout(0.2),
        
        Dense(32, activation='relu'),
        Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model
```

### Option 3: CNN (2D Images)

```python
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Dense, Flatten, Dropout
from tensorflow.keras.applications import MobileNetV2

def build_cnn_model(input_shape=(224, 224, 3), num_classes=36):
    """
    Transfer Learning with MobileNetV2
    Efficient for mobile/web deployment
    """
    base_model = MobileNetV2(
        input_shape=input_shape,
        include_top=False,
        weights='imagenet'
    )
    
    # Freeze base layers
    base_model.trainable = False
    
    model = Sequential([
        base_model,
        
        MaxPooling2D(pool_size=(4, 4)),
        Flatten(),
        
        Dense(256, activation='relu'),
        Dropout(0.3),
        
        Dense(128, activation='relu'),
        Dropout(0.2),
        
        Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model
```

**Recommendation:** Sử dụng **Option 1 (Simple DNN)** cho bắt đầu - nhanh và dễ train.

---

## 🏋️ Training

**File:** `ml-service/train.py`

```python
import numpy as np
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, LearningRateReducer
from model import build_simple_model
import matplotlib.pyplot as plt

# Load data
X_train = np.load('data/processed/X_train.npy')
X_test = np.load('data/processed/X_test.npy')
y_train = np.load('data/processed/y_train.npy')
y_test = np.load('data/processed/y_test.npy')

# Build model
model = build_simple_model(input_shape=63, num_classes=36)
model.summary()

# Callbacks
callbacks = [
    EarlyStopping(
        monitor='val_loss',
        patience=10,
        restore_best_weights=True
    ),
    ModelCheckpoint(
        'models/best_model.h5',
        monitor='val_accuracy',
        save_best_only=True
    ),
    LearningRateReducer(
        monitor='val_loss',
        factor=0.5,
        patience=5,
        min_lr=1e-6
    )
]

# Train
print("Training model...")
history = model.fit(
    X_train, y_train,
    validation_data=(X_test, y_test),
    epochs=100,
    batch_size=32,
    callbacks=callbacks,
    verbose=1
)

# Save model
model.save('models/gesture_model.h5')

# Plot results
plt.figure(figsize=(12, 4))

plt.subplot(1, 2, 1)
plt.plot(history.history['accuracy'], label='Train Accuracy')
plt.plot(history.history['val_accuracy'], label='Val Accuracy')
plt.title('Model Accuracy')
plt.ylabel('Accuracy')
plt.xlabel('Epoch')
plt.legend()

plt.subplot(1, 2, 2)
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Val Loss')
plt.title('Model Loss')
plt.ylabel('Loss')
plt.xlabel('Epoch')
plt.legend()

plt.tight_layout()
plt.savefig('training_history.png')
print("Training plot saved!")
```

**Run Training:**
```bash
cd ml-service
python train.py
```

**Expected Output:**
```
Epoch 1/100
45/45 ▰▰▰▰▰▰▰▰▰▰ 2s 45ms/step - loss: 3.5843 - accuracy: 0.0521 - val_loss: 3.5123 - val_accuracy: 0.0758
Epoch 2/100
45/45 ▰▰▰▰▰▰▰▰▰▰ 1s 29ms/step - loss: 3.2145 - accuracy: 0.1234 - val_loss: 2.8934 - val_accuracy: 0.2156
...
```

---

## 📈 Evaluation

**File:** `ml-service/evaluate.py`

```python
import numpy as np
from tensorflow.keras.models import load_model
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score
)
import matplotlib.pyplot as plt
import seaborn as sns

# Load model
model = load_model('models/gesture_model.h5')

# Load test data
X_test = np.load('data/processed/X_test.npy')
y_test = np.load('data/processed/y_test.npy')

# Predict
y_pred_prob = model.predict(X_test)
y_pred = np.argmax(y_pred_prob, axis=1)
y_true = np.argmax(y_test, axis=1)

# Accuracy
accuracy = accuracy_score(y_true, y_pred)
print(f"Accuracy: {accuracy:.4f}")

# Classification report
print("\nClassification Report:")
print(classification_report(y_true, y_pred, target_names=LABELS))

# Confusion matrix
cm = confusion_matrix(y_true, y_pred)

plt.figure(figsize=(12, 10))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
plt.title('Confusion Matrix')
plt.ylabel('True Label')
plt.xlabel('Predicted Label')
plt.savefig('confusion_matrix.png')
print("\nConfusion matrix saved!")
```

---

## 🎥 Real-time Recognition

**File:** `ml-service/gesture_recognizer.py`

```python
import cv2
import numpy as np
import mediapipe as mp
from tensorflow.keras.models import load_model
from collections import deque

LABELS = list(map(str, range(10))) + list('ABCDEFGHIJKLMNOPQRSTUVWXYZ') + ['_']

class GestureRecognizer:
    def __init__(self, model_path='models/gesture_model.h5'):
        self.model = load_model(model_path)
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        
        # Smoothing predictions
        self.prediction_history = deque(maxlen=5)
    
    def recognize(self, frame):
        """
        Recognize gesture in frame
        """
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        if not results.multi_hand_landmarks:
            return None
        
        # Extract landmarks
        landmarks = []
        for landmark in results.multi_hand_landmarks[0].landmark:
            landmarks.extend([landmark.x, landmark.y, landmark.z])
        
        landmarks = np.array(landmarks).reshape(1, -1)
        
        # Predict
        prediction = self.model.predict(landmarks, verbose=0)
        gesture_id = np.argmax(prediction)
        confidence = float(prediction[0][gesture_id])
        
        # Smooth predictions
        self.prediction_history.append(gesture_id)
        smoothed_id = int(np.median(self.prediction_history))
        
        return {
            'gesture_id': smoothed_id,
            'gesture_label': LABELS[smoothed_id],
            'confidence': confidence,
            'landmarks': results.multi_hand_landmarks[0]
        }

# Real-time demo
if __name__ == "__main__":
    recognizer = GestureRecognizer()
    cap = cv2.VideoCapture(0)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        result = recognizer.recognize(frame)
        
        if result:
            label = result['gesture_label']
            confidence = result['confidence']
            cv2.putText(
                frame,
                f"{label} ({confidence:.2f})",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2
            )
        
        cv2.imshow('Gesture Recognition', frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
```

**Run Demo:**
```bash
cd ml-service
python gesture_recognizer.py
```

---

## ⚡ Model Optimization

### Quantization (Giảm kích thước)

```python
import tensorflow as tf

# Load model
model = tf.keras.models.load_model('models/gesture_model.h5')

# Convert to TFLite (quantized)
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

# Save
with open('models/gesture_model.tflite', 'wb') as f:
    f.write(tflite_model)

print("Model quantized!")
```

### Model Pruning (Xóa weights không cần thiết)

```python
import tensorflow_model_optimization as tfmot

# Load model
model = tf.keras.models.load_model('models/gesture_model.h5')

# Prune model
pruning_schedule = tfmot.sparsity.keras.PolynomialDecay(
    initial_sparsity=0.0,
    final_sparsity=0.5,
    begin_step=0,
    end_step=1000
)

pruned_model = tfmot.sparsity.keras.prune_low_magnitude(
    model,
    pruning_schedule=pruning_schedule
)

pruned_model.compile(...)
# Re-train...
```

---

## 🔗 Integration dengan Backend

**Backend sử dụng ML model:**

```python
# app/services/gesture_service.py
from ml_service.gesture_recognizer import GestureRecognizer

recognizer = GestureRecognizer()

async def recognize_gesture_from_image(image_bytes):
    """
    Integrate ML model with FastAPI
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    result = recognizer.recognize(image)
    return result
```

---

## 📊 Metrics & Monitoring

```python
# Monitor training metrics
metrics = {
    'accuracy': 0.92,
    'precision': 0.89,
    'recall': 0.87,
    'f1_score': 0.88,
    'inference_time': 0.045  # seconds
}

# Expected performance:
# - Accuracy: 85-92%
# - Inference time: 30-50ms per frame
# - Model size: 5-20MB
```

---

## 🎯 Troubleshooting

**Problem: Low accuracy**
- [ ] Increase dataset size
- [ ] Use data augmentation
- [ ] Adjust model architecture
- [ ] Increase training epochs
- [ ] Check data quality

**Problem: Slow inference**
- [ ] Use quantization
- [ ] Reduce model size
- [ ] Use GPU
- [ ] Optimize image preprocessing

**Problem: Inconsistent predictions**
- [ ] Add prediction smoothing
- [ ] Increase confidence threshold
- [ ] Train with more diverse data

---

**Happy Training! 🤖**

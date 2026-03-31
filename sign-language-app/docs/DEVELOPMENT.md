# 🧑‍💻 Development Guide

**Hướng Dẫn Phát Triển Sign Language App**

---

## 📋 Mục Lục

1. [Development Environment](#development-environment)
2. [Git Workflow](#git-workflow)
3. [Frontend Development](#frontend-development)
4. [Backend Development](#backend-development)
5. [ML Development](#ml-development)
6. [Testing](#testing)
7. [Code Standards](#code-standards)
8. [Debugging](#debugging)

---

## 🔧 Development Environment

### VS Code Extensions (Khuyến Nghị)
```
- Python
- Pylance
- FastAPI
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Thunder Client (API testing)
```

### Python Version
```powershell
python --version  # Phải ≥ 3.9
```

### Node.js Version
```powershell
node --version    # Phải ≥ 16
```

---

## 🔄 Git Workflow

### Branch Naming
```
main                    # Production
development             # Staging
feature/description     # New features
bugfix/description      # Bug fixes
hotfix/description      # Critical fixes
```

### Commit Message Format
```
[FEATURE] Add user authentication
[BUGFIX] Fix gesture recognition accuracy
[DOCS] Update API documentation
[REFACTOR] Optimize image processing
[TEST] Add unit tests for chat
```

### Example Workflow
```bash
# Create feature branch
git checkout -b feature/gesture-recognition

# Make changes and commit
git add .
git commit -m "[FEATURE] Implement gesture recognition API"

# Push to remote
git push origin feature/gesture-recognition

# Create pull request on GitHub
# After review → merge to development
# After testing → merge to main
```

---

## 🎨 Frontend Development

### Project Structure
```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── CameraFeed.jsx
│   │   ├── ChatBox.jsx
│   │   ├── VocabularyCard.jsx
│   │   └── ...
│   ├── pages/              # Route pages
│   │   ├── Home.jsx
│   │   ├── Recognition.jsx
│   │   ├── Learn.jsx
│   │   ├── Chat.jsx
│   │   ├── Profile.jsx
│   │   └── ...
│   ├── services/           # API & business logic
│   │   ├── api.js
│   │   ├── auth.js
│   │   └── socket.js
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useApi.js
│   │   └── ...
│   ├── utils/              # Utilities
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   └── constants.js
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js
```

### Creating a New Component

**File:** `src/components/GestureDisplay.jsx`
```jsx
import React, { useState, useEffect } from 'react';

export function GestureDisplay({ gesturePath }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load gesture video/animation
    setLoading(true);
    try {
      // Load logic here
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [gesturePath]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="gesture-display">
      {/* Display gesture here */}
    </div>
  );
}
```

### Using API Service

**File:** `src/services/api.js`
```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const recognizeGesture = (imageFile) => 
  API.post('/gesture/recognize', { image: imageFile }, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const sendMessage = (roomId, content) =>
  API.post('/chat/messages', { room_id: roomId, content });

export const getLessons = () => API.get('/learn/lessons');

export default API;
```

### Component with Custom Hook

**File:** `src/hooks/useGestureRecognition.js`
```javascript
import { useState, useCallback } from 'react';
import { recognizeGesture } from '../services/api';

export function useGestureRecognition() {
  const [gesture, setGesture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const recognize = useCallback(async (imageFile) => {
    setLoading(true);
    setError(null);
    try {
      const response = await recognizeGesture(imageFile);
      setGesture(response.data.gesture_label);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { gesture, loading, error, recognize };
}
```

### Using the Hook

```jsx
import { useGestureRecognition } from '../hooks/useGestureRecognition';

export function RecognitionPage() {
  const { gesture, loading, error, recognize } = useGestureRecognition();
  const fileInputRef = useRef();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) await recognize(file);
  };

  return (
    <div>
      <input 
        type="file" 
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageUpload}
      />
      {loading && <p>Recognizing...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {gesture && <p>Gesture: {gesture}</p>}
    </div>
  );
}
```

### Frontend Testing

**File:** `src/components/__tests__/GestureDisplay.test.jsx`
```javascript
import { render, screen } from '@testing-library/react';
import { GestureDisplay } from '../GestureDisplay';

describe('GestureDisplay', () => {
  it('should render loading state', () => {
    render(<GestureDisplay gesturePath="/path" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(<GestureDisplay gesture={{ error: 'Failed' }} />);
    expect(screen.getByText(/Failed/)).toBeInTheDocument();
  });
});
```

### Development Commands
```bash
cd frontend

# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Format code with Prettier
npm run format

# Lint code
npm run lint

# Run tests
npm test
```

---

## 🐍 Backend Development

### Project Structure
```
backend/
├── app/
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── gesture.py
│   │   ├── chat.py
│   │   ├── learn.py
│   │   └── profile.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user_model.py
│   │   ├── gesture_model.py
│   │   └── ...
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── ...
│   ├── services/
│   │   ├── __init__.py
│   │   ├── database.py
│   │   ├── mongodb.py
│   │   └── ...
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── auth.py
│   ├── config.py
│   └── __init__.py
├── main.py
├── requirements.txt
└── .env
```

### Creating a New Route

**File:** `app/routes/gesture.py`
```python
from fastapi import APIRouter, File, UploadFile, Depends
from app.services.gesture_service import recognize_gesture
from app.middleware.auth import get_current_user
from app.schemas.gesture import GestureResponse

router = APIRouter()

@router.post("/recognize", response_model=GestureResponse)
async def recognize(
    image: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Recognize gesture from uploaded image
    """
    contents = await image.read()
    result = await recognize_gesture(contents)
    
    return GestureResponse(
        gesture_label=result['label'],
        confidence=result['confidence']
    )

@router.get("/history")
async def get_history(
    limit: int = 10,
    offset: int = 0,
    current_user = Depends(get_current_user)
):
    """Get recognition history for current user"""
    # TODO: Implement
    pass
```

### Database Model

**File:** `app/models/user_model.py`
```python
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.services.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Pydantic Schema

**File:** `app/schemas/user.py`
```python
from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: datetime

    class Config:
        from_attributes = True
```

### Service Layer

**File:** `app/services/gesture_service.py`
```python
import cv2
import numpy as np
from app.ml.gesture_recognizer import GestureRecognizer

recognizer = GestureRecognizer()

async def recognize_gesture(image_bytes):
    """
    Process gesture recognition
    """
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Recognize gesture
    result = recognizer.recognize(image)
    
    return result
```

### Development Commands
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run server
python main.py

# Add new dependency
pip install fastapi
pip freeze > requirements.txt
```

### Database Migrations (Alembic)

```bash
# Initialize Alembic
alembic init -t async migrations

# Create migration
alembic revision --autogenerate -m "Add user table"

# Apply migration
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

---

## 🤖 ML Development

### Training Gesture Recognition Model

**File:** `ml-service/train.py`
```python
import numpy as np
from tensorflow import keras
from sklearn.model_selection import train_test_split
from utils.preprocessor import preprocess_images
from utils.trainer import build_model, train_model

# Load dataset
X, y = preprocess_images('data/train')

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Build and train model
model = build_model(X_train.shape[1], len(np.unique(y)))
history = train_model(model, X_train, y_train, X_test, y_test)

# Save model
model.save('models/gesture_model.h5')
```

### Real-time Recognition

**File:** `ml-service/gesture_recognizer.py`
```python
import cv2
import mediapipe as mp
import numpy as np
from tensorflow.keras.models import load_model

class GestureRecognizer:
    def __init__(self, model_path='models/gesture_model.h5'):
        self.model = load_model(model_path)
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5
        )
    
    def recognize(self, frame):
        """
        Recognize gesture in frame
        - Input: CV2 frame (BGR)
        - Output: gesture label and confidence
        """
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        if not results.multi_hand_landmarks:
            return None
        
        # Extract landmarks from first hand
        landmarks = []
        for landmark in results.multi_hand_landmarks[0].landmark:
            landmarks.extend([landmark.x, landmark.y, landmark.z])
        
        landmarks = np.array(landmarks).reshape(1, -1)
        prediction = self.model.predict(landmarks, verbose=0)
        gesture_id = np.argmax(prediction)
        confidence = float(prediction[0][gesture_id])
        
        return {
            'gesture_id': int(gesture_id),
            'confidence': confidence
        }
```

### Development Commands
```bash
cd ml-service

# Create virtual environment
python -m venv venv
venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Train model
python train.py

# Test recognition
python gesture_recognizer.py
```

---

## 🧪 Testing

### Frontend Testing
```bash
cd frontend

# Install test dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

### Backend Testing
```bash
cd backend

# Install pytest
pip install pytest pytest-asyncio

# Run tests
pytest

# Run with coverage
pytest --cov=app
```

### Example Backend Test
```python
# test_auth.py
import pytest
from app.routes.auth import router
from fastapi.testclient import TestClient

client = TestClient(app)

def test_register():
    response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "TestPass123!",
        "full_name": "Test User"
    })
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"

def test_login():
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "TestPass123!"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
```

---

## 📋 Code Standards

### Python (Backend)
```python
# Follow PEP 8
# Use type hints
def recognize_gesture(image: np.ndarray) -> dict:
    pass

# Docstrings in Google style
def send_message(room_id: str, content: str) -> Message:
    """
    Send message to chat room.
    
    Args:
        room_id: UUID of the chat room
        content: Message content (max 1000 chars)
    
    Returns:
        Message object with created_at timestamp
    
    Raises:
        ValueError: If content is empty or too long
        NotFoundError: If room_id doesn't exist
    """
    pass
```

### JavaScript/React (Frontend)
```javascript
// Use ESLint + Prettier
// Component naming: PascalCase
function GestureDisplay() { }

// Function naming: camelCase
function handleImageUpload() { }

// Constant naming: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Use JSDoc comments
/**
 * Recognize gesture from image file
 * @param {File} imageFile - The image file to recognize
 * @returns {Promise<Object>} Gesture recognition result
 * @throws {Error} If image processing fails
 */
async function recognizeGesture(imageFile) { }
```

---

## 🐛 Debugging

### Backend Debugging

**Using print statements:**
```python
print(f"DEBUG: gesture_id={gesture_id}, confidence={confidence}")
```

**Using Python debugger:**
```python
import pdb
pdb.set_trace()  # Breakpoint
```

**Using logger (recommended):**
```python
import logging
logger = logging.getLogger(__name__)

logger.info(f"Gesture recognized: {gesture_id}")
logger.error(f"Recognition failed: {error}")
```

### Frontend Debugging

**Browser DevTools:**
- F12 → Console tab
- Network tab for API calls
- Application tab for localStorage

**VS Code Debugger:**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch in Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/frontend"
    }
  ]
}
```

---

**Happy Coding! 🚀**

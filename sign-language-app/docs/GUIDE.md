# 📖 Hướng Dẫn Chi Tiết Ứng Dụng Hỗ Trợ Ngôn Ngữ Ký Hiệu

**Phiên bản:** 1.0.0  
**Ngày tạo:** Tháng 3, 2026  
**Tác giả:** AI Assistant

---

## 📋 Mục Lục

1. [Tổng Quan Dự Án](#tổng-quan-dự-án)
2. [Tech Stack & Công Nghệ](#tech-stack)
3. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
4. [Cài Đặt & Setup](#cài-đặt--setup)
5. [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
6. [Chạy Ứng Dụng](#chạy-ứng-dụng)
7. [API Documentation](#api-documentation)
8. [Hướng Dẫn Từng Thành Phần](#hướng-dẫn-từng-thành-phần)
9. [Phase Phát Triển](#phase-phát-triển)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Tổng Quan Dự Án

### Mục Đích
Tạo một **ứng dụng web toàn diện** giúp:
- ✅ Người khiếm thính nhận diện ký hiệu real-time từ camera
- ✅ Dịch văn bản ↔ ký hiệu
- ✅ Giao tiếp trực tuyến giữa users
- ✅ Học ngôn ngữ ký hiệu qua khóa học
- ✅ Quản lý hồ sơ cá nhân

### Các Tác Nhân (Actors)
| Actor | Vai Trò |
|-------|---------|
| **Người Dùng (User)** | Học tập, giao tiếp, dịch |
| **Người Khiếm Thính** | Sử dụng nhận diện real-time |
| **Hệ Thống AI** | Xử lý và nhận diện ký hiệu |

### Chức Năng Chính
1. **Nhận Diện Ký Hiệu Real-time** 🎥
   - Bật camera
   - AI nhận diện tay
   - Chuyển ký hiệu → văn bản
   - Hiển thị kết quả liên tục

2. **Dịch Văn Bản ↔ Ký Hiệu** 📝
   - Nhập văn bản
   - Hiển thị animation/video ký hiệu
   - Ghi âm/phát âm

3. **Quản Lý Hồ Sơ & Vocabulary** 👤
   - Cập nhật thông tin cá nhân
   - Xem danh sách từ đã học
   - Lưu trữ progress

4. **Học From Vựng** 📚
   - Xem video ký hiệu
   - Nghe mô tả
   - Làm bài kiểm tra
   - Xem điểm số

5. **Giao Tiếp Trực Tuyến** 💬
   - Chat text với users khác
   - Gửi ký hiệu qua camera
   - Chuyển đổi nội dung real-time

6. **Xác Thực & Hỗ Trợ** 🔐
   - Đăng ký / Đăng nhập
   - Quân lý tài khoản
   - Hướng dẫn sử dụng

---

## 🛠️ Tech Stack

### Frontend
```
├── React.js 18+
├── Vite (Build tool)
├── Tailwind CSS (Styling)
├── Axios (HTTP client)
├── Socket.IO Client (Real-time)
└── OpenCV.js (Image processing)
```

### Backend
```
├── FastAPI (Framework)
├── Python 3.9+
├── SQLAlchemy (ORM)
├── Motor (MongoDB async)
├── Redis (Caching)
├── JWT (Authentication)
└── WebSocket (Real-time)
```

### Machine Learning
```
├── MediaPipe (Hand estimation)
├── TensorFlow/Keras (Model training)
├── NumPy (Data processing)
├── OpenCV (Image processing)
└── scikit-learn (Metrics)
```

### Database
```
├── PostgreSQL 12+ (Relational data)
└── MongoDB 4.4+ (Document storage)
```

### DevOps
```
├── Docker
├── Docker Compose
├── GitHub Actions (CI/CD)
└── AWS/GCP (Deployment)
```

---

## 💻 Yêu Cầu Hệ Thống

### Tối Thiểu
- RAM: 8GB
- CPU: 4 cores
- Disk: 10GB
- OS: Windows 10+, macOS 10.15+, Linux Ubuntu 20.04+

### Khuyến Nghị
- RAM: 16GB
- CPU: 8 cores (với GPU tốt hơn cho ML)
- GPU: NVIDIA CUDA compatible (tuỳ chọn)
- Disk: 50GB

### Phần Mềm Cần Cài Đặt
- ✅ Python 3.9+ (https://www.python.org/)
- ✅ Node.js 16+ (https://nodejs.org/)
- ✅ Docker & Docker Compose (https://www.docker.com/)
- ✅ PostgreSQL 12+ (https://www.postgresql.org/)
- ✅ MongoDB 4.4+ (https://www.mongodb.com/)
- ✅ Git (https://git-scm.com/)

---

## 🚀 Cài Đặt & Setup

### **Option 1: Docker Setup (KHUYẾN NGHỊ - Nhanh Nhất)**

**Bước 1:** Mở PowerShell và navigate vào project
```powershell
cd d:/GitHub/HCL/sign-language-app
```

**Bước 2:** Kiểm tra Docker đã cài
```powershell
docker --version
docker-compose --version
```

**Bước 3:** Tạo file `.env`
```powershell
# Windows PowerShell
Copy-Item "backend\.env.example" -Destination "backend\.env"
Copy-Item "frontend\.env.example" -Destination "frontend\.env"
```

**Bước 4:** Chỉnh sửa `.env` files (nếu cần)
```env
# backend/.env
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@postgres:5432/sign_language_db
MONGO_URL=mongodb://mongo:27017
REDIS_URL=redis://redis:6379
SECRET_KEY=your-secret-key-change-in-production
```

**Bước 5:** Start Docker Compose
```powershell
docker-compose up -d
```

**Bước 6:** Kiểm tra services
```powershell
docker-compose ps
```

**Output mong đợi:**
```
NAME                  STATUS
sign-language-postgres   Up
sign-language-mongo      Up
sign-language-redis      Up
sign-language-backend    Up (port 8000)
sign-language-frontend   Up (port 5173)
```

### **Option 2: Manual Setup (Chi Tiết Hơn)**

#### **Part A: Backend Setup**

**Bước 1:** Tạo Virtual Environment
```powershell
cd d:/GitHub/HCL/sign-language-app/backend
python -m venv venv
```

**Bước 2:** Activate Virtual Environment
```powershell
# Windows PowerShell
venv\Scripts\Activate.ps1

# Hoặc nếu báo lỗi permission:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
venv\Scripts\Activate.ps1
```

**Bước 3:** Cài Đặt Dependencies
```powershell
pip install -r requirements.txt
```

**Bước 4:** Setup Database
```powershell
# Tạo PostgreSQL database
# (Cần PostgreSQL đã cài đặt)
psql -U postgres
```

Trong PostgreSQL CLI:
```sql
CREATE DATABASE sign_language_db;
CREATE USER sign_language_user WITH PASSWORD 'your_password';
ALTER ROLE sign_language_user SET client_encoding TO 'utf8';
ALTER ROLE sign_language_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE sign_language_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE sign_language_db TO sign_language_user;
\q
```

**Bước 5:** Tạo `.env` file
```powershell
# Tạo file backend/.env
DATABASE_URL=postgresql://sign_language_user:your_password@localhost:5432/sign_language_db
MONGO_URL=mongodb://localhost:27017/sign_language_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173
```

**Bước 6:** Chạy Backend
```powershell
python main.py
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
Press CTRL+C to quit
```

---

#### **Part B: Frontend Setup**

**Bước 1:** Navigate vào Frontend
```powershell
cd d:/GitHub/HCL/sign-language-app/frontend
```

**Bước 2:** Cài NPM Dependencies
```powershell
npm install
```

**Bước 3:** Tạo `.env` file
```powershell
# frontend/.env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

**Bước 4:** Chạy Development Server
```powershell
npm run dev
```

**Expected Output:**
```
  VITE v4.x.x  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

#### **Part C: ML Service Setup**

**Bước 1:** Navigate vào ML Service
```powershell
cd d:/GitHub/HCL/sign-language-app/ml-service
```

**Bước 2:** Tạo Virtual Environment
```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

**Bước 3:** Cài Đặt Dependencies
```powershell
pip install -r requirements.txt
```

---

## 📁 Cấu Trúc Dự Án

```
sign-language-app/
│
├── 📂 frontend/                    # React Web Application
│   ├── 📂 public/
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── CameraFeed.jsx
│   │   │   ├── ChatBox.jsx
│   │   │   └── ...
│   │   ├── 📂 pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Recognition.jsx (Nhận diện real-time)
│   │   │   ├── Learn.jsx (Học từ vựng)
│   │   │   ├── Chat.jsx (Giao tiếp)
│   │   │   ├── Profile.jsx (Hồ sơ)
│   │   │   └── Translation.jsx (Dịch)
│   │   ├── 📂 services/
│   │   │   ├── api.js (API requests)
│   │   │   ├── socket.js (WebSocket)
│   │   │   └── auth.js (Authentication)
│   │   ├── 📂 utils/
│   │   │   ├── validators.js
│   │   │   ├── formatters.js
│   │   │   └── constants.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   └── Dockerfile
│
├── 📂 backend/                     # FastAPI Backend
│   ├── 📂 app/
│   │   ├── 📂 routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py (Đăng ký, đăng nhập)
│   │   │   ├── gesture.py (Nhận diện ký hiệu)
│   │   │   ├── chat.py (Giao tiếp)
│   │   │   ├── learn.py (Học tập)
│   │   │   ├── profile.py (Hồ sơ)
│   │   │   └── translate.py (Dịch)
│   │   ├── 📂 models/
│   │   │   ├── __init__.py
│   │   │   ├── user_model.py (User)
│   │   │   ├── gesture_model.py (Gesture)
│   │   │   ├── chat_model.py (Chat)
│   │   │   ├── lesson_model.py (Lesson)
│   │   │   └── vocabulary_model.py (Vocabulary)
│   │   ├── 📂 schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py (User schema)
│   │   │   ├── gesture.py (Gesture schema)
│   │   │   └── chat.py (Chat schema)
│   │   ├── 📂 services/
│   │   │   ├── __init__.py
│   │   │   ├── database.py (PostgreSQL)
│   │   │   ├── mongodb.py (MongoDB)
│   │   │   ├── redis_service.py (Caching)
│   │   │   ├── auth_service.py (JWT)
│   │   │   └── gesture_service.py (ML integration)
│   │   ├── config.py (Configuration)
│   │   └── __init__.py
│   ├── main.py (Entry point)
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── 📂 ml-service/                  # Machine Learning Service
│   ├── __main__.py (Entry point)
│   ├── gesture_recognizer.py (Main ML class)
│   ├── 📂 models/
│   │   ├── gesture_model.h5 (Trained model)
│   │   └── ...
│   ├── 📂 data/
│   │   ├── train/
│   │   └── test/
│   ├── 📂 utils/
│   │   ├── __init__.py
│   │   ├── preprocessor.py (Tiền xử lý)
│   │   └── trainer.py (Huấn luyện)
│   └── requirements.txt
│
├── 📂 docs/                        # Documentation
│   ├── README.md (Overview)
│   ├── INSTALLATION.md (Cài đặt)
│   ├── STRUCTURE.md (Cấu trúc)
│   ├── GUIDE.md (You are here!)
│   ├── API.md (API documentation)
│   ├── ML-GUIDE.md (ML pipeline)
│   └── DEPLOYMENT.md (Triển khai)
│
├── docker-compose.yml              # Docker configuration
├── .env.example                    # Example environment
├── .gitignore
└── README.md (Main readme)
```

---

## ▶️ Chạy Ứng Dụng

### Cách 1: Docker Compose (Toàn Bộ)
```powershell
cd d:/GitHub/HCL/sign-language-app

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Cách 2: Manual (Từng Phần)

**Terminal 1 - Backend:**
```powershell
cd backend
venv\Scripts\Activate.ps1
python main.py
# http://localhost:8000
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
# http://localhost:5173
```

**Terminal 3 - ML Service (tuỳ chọn):**
```powershell
cd ml-service
venv\Scripts\Activate.ps1
python -m __main__
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Swagger UI
```
http://localhost:8000/docs
```

### Endpoints Chính

#### **1. Authentication** 🔐

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| POST | `/auth/register` | Đăng ký tài khoản |
| POST | `/auth/login` | Đăng nhập |
| POST | `/auth/logout` | Đăng xuất |
| POST | `/auth/refresh` | Refresh token |

**Example - Register:**
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123",
    "full_name": "Nguyen Van A"
  }'
```

**Response:**
```json
{
  "user_id": "uuid-here",
  "email": "user@example.com",
  "full_name": "Nguyen Van A",
  "created_at": "2026-03-31T10:00:00Z"
}
```

---

#### **2. Gesture Recognition** 🎥

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| POST | `/gesture/recognize` | Nhận diện ký hiệu từ ảnh |
| GET | `/gesture/history` | Xem lịch sử nhận diện |
| DELETE | `/gesture/history/{id}` | Xóa lịch sử |

**Example - Recognize:**
```bash
curl -X POST "http://localhost:8000/api/gesture/recognize" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@hand_image.jpg"
```

**Response:**
```json
{
  "gesture": "A",
  "confidence": 0.92,
  "timestamp": "2026-03-31T10:05:00Z",
  "landmarks": [
    {"x": 0.5, "y": 0.5, "z": 0.1},
    ...
  ]
}
```

---

#### **3. Chat** 💬

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| POST | `/chat/messages` | Gửi tin nhắn |
| GET | `/chat/messages/{room_id}` | Lấy tin nhắn |
| POST | `/chat/rooms` | Tạo phòng chat |
| GET | `/chat/rooms` | Danh sách phòng |

**Example - Send Message:**
```bash
curl -X POST "http://localhost:8000/api/chat/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": "room-uuid",
    "content": "Xin chào!",
    "message_type": "text"
  }'
```

---

#### **4. Learning** 📚

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| GET | `/learn/lessons` | Danh sách bài học |
| GET | `/learn/lessons/{id}` | Chi tiết bài học |
| POST | `/learn/lessons/{id}/complete` | Hoàn thành bài |
| GET | `/learn/vocabulary` | Danh sách từ vựng |
| POST | `/learn/test` | Làm bài kiểm tra |

---

#### **5. Profile** 👤

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| GET | `/profile/me` | Thông tin cá nhân |
| PUT | `/profile/me` | Cập nhật thông tin |
| GET | `/profile/statistics` | Thống kê progress |
| GET | `/profile/bookmarks` | Bookmark |

---

#### **6. Translation** 📝

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| POST | `/translate/text-to-gesture` | Dịch text → ký hiệu |
| POST | `/translate/gesture-to-text` | Dịch ký hiệu → text |

---

## 🔧 Hướng Dẫn Từng Thành Phần

### **A. Frontend React**

#### Chạy Development
```bash
cd frontend
npm install          # Cài dependencies
npm run dev         # Start dev server
npm run build       # Build production
npm run preview     # Preview build
```

#### Cấu Trúc Component
```jsx
// src/components/CameraFeed.jsx
import React, { useRef, useState } from 'react';

export function CameraFeed() {
  const videoRef = useRef(null);
  const [gesture, setGesture] = useState(null);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' }
    });
    videoRef.current.srcObject = stream;
  };

  return (
    <div>
      <video ref={videoRef} autoPlay />
      <button onClick={startCamera}>Start Camera</button>
      {gesture && <p>Recognized: {gesture}</p>}
    </div>
  );
}
```

#### API Service
```jsx
// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const recognizeGesture = (imageData) => 
  API.post('/gesture/recognize', imageData);

export const sendMessage = (roomId, content) =>
  API.post('/chat/messages', { room_id: roomId, content });

export default API;
```

---

### **B. Backend FastAPI**

#### Project Structure
```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, gesture, chat, learn, profile

app = FastAPI(title="Sign Language API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(gesture.router, prefix="/api/gesture", tags=["gesture"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(learn.router, prefix="/api/learn", tags=["learn"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### Tạo Endpoint Mới
```python
# app/routes/gesture.py
from fastapi import APIRouter, File, UploadFile, Depends
from app.services.gesture_service import recognize_gesture

router = APIRouter()

@router.post("/recognize")
async def recognize(
    image: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    gesture = await recognize_gesture(image.file)
    return {
        "gesture": gesture['label'],
        "confidence": gesture['confidence']
    }
```

---

### **C. Machine Learning Service**

#### Nhận Diện Ký Hiệu
```python
# gesture_recognizer.py
import cv2
import numpy as np
import mediapipe as mp
from tensorflow.keras.models import load_model

class GestureRecognizer:
    def __init__(self, model_path='models/gesture_model.h5'):
        self.model = load_model(model_path)
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands()
        
    def recognize(self, image):
        """
        Nhận diện ký hiệu từ ảnh
        """
        results = self.hands.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        
        if results.multi_hand_landmarks:
            landmarks = []
            for hand_landmarks in results.multi_hand_landmarks:
                for lm in hand_landmarks.landmark:
                    landmarks.extend([lm.x, lm.y, lm.z])
            
            landmarks = np.array(landmarks).reshape(1, -1)
            prediction = self.model.predict(landmarks)
            gesture_id = np.argmax(prediction)
            confidence = float(prediction[0][gesture_id])
            
            return {
                'gesture_id': int(gesture_id),
                'confidence': confidence,
                'landmarks': landmarks.tolist()
            }
        
        return None
```

#### Huấn Luyện Model
```python
# utils/trainer.py
from tensorflow.keras import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

def build_model(input_shape=(63,), num_classes=36):
    """
    Xây dựng model LSTM cho nhận diện ký hiệu
    """
    model = Sequential([
        LSTM(128, activation='relu', input_shape=input_shape),
        Dropout(0.2),
        Dense(64, activation='relu'),
        Dropout(0.2),
        Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def train_model(X_train, y_train, X_test, y_test):
    model = build_model(X_train.shape[1], y_train.shape[1])
    
    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=50,
        batch_size=32,
        verbose=1
    )
    
    model.save('models/gesture_model.h5')
    return model, history
```

---

## 📊 Phase Phát Triển

### **Phase 1: MVP (2-3 Tuần)**
- [x] Setup project structure
- [ ] Authentication (Register/Login)
- [ ] Gesture recognition real-time
- [ ] Basic UI
- **Deliverable:** Nhận diện ký hiệu từ camera

**Checklist:**
```
- [ ] Backend API running
- [ ] Frontend connects to API
- [ ] User can login
- [ ] Camera feed working
- [ ] Gesture recognition working
```

---

### **Phase 2: Core Features (3-4 Tuần)**
- [ ] Text to Gesture translation
- [ ] Database integration
- [ ] User profile management
- [ ] Vocabulary system
- **Deliverable:** Dịch văn bản, upload hồ sơ

**Checklist:**
```
- [ ] Text input form
- [ ] Gesture video animation
- [ ] Profile CRUD
- [ ] Vocabulary database
- [ ] Progress tracking
```

---

### **Phase 3: Social & Learning (2-3 Tuần)**
- [ ] Real-time chat (WebSocket)
- [ ] Learning modules
- [ ] Quiz system
- [ ] Leaderboard
- **Deliverable:** Giao tiếp trực tuyến, học tập

**Checklist:**
```
- [ ] Socket.IO integration
- [ ] Chat history
- [ ] Lessons CRUD
- [ ] Quiz scoring
- [ ] Notifications
```

---

### **Phase 4: Optimization & Deployment (1-2 Tuần)**
- [ ] Performance optimization
- [ ] Testing (Unit, Integration)
- [ ] Security hardening
- [ ] Deployment (Docker, AWS/GCP)
- **Deliverable:** Production-ready app

**Checklist:**
```
- [ ] Load testing
- [ ] 90%+ test coverage
- [ ] HTTPS enabled
- [ ] CI/CD pipeline
- [ ] Monitoring setup
```

---

## 🐛 Troubleshooting

### **Docker Issues**

**Problem: "Docker daemon not running"**
```powershell
# Solution:
# 1. Mở Docker Desktop application
# 2. Hoặc khởi động Docker service:
Start-Service Docker
```

**Problem: "Port 5173/8000 already in use"**
```powershell
# Tìm process sử dụng port:
Get-NetTCPConnection -LocalPort 8000

# Kill process:
Stop-Process -Id <PID> -Force
```

---

### **Backend Issues**

**Problem: "ModuleNotFoundError: No module named 'fastapi'"**
```powershell
# Solution:
cd backend
pip install -r requirements.txt
```

**Problem: "PostgreSQL connection refused"**
```powershell
# Kiểm tra PostgreSQL running:
pg_isready -h localhost -p 5432

# Start PostgreSQL (nếu cần):
# Windows: Services > PostgreSQL > Start
```

---

### **Frontend Issues**

**Problem: "npm ERR! Cannot find module"**
```powershell
# Solution:
cd frontend
rm -r node_modules
npm install
```

**Problem: "API requests failing (CORS error)"**
```javascript
// Kiểm tra api.js baseURL:
const API = axios.create({
  baseURL: 'http://localhost:8000/api' // Phải đúng
});
```

---

### **ML Issues**

**Problem: "No GPU detected"**
```python
# Check:
import tensorflow as tf
print(tf.config.list_physical_devices('GPU'))

# Nếu không có GPU, model sẽ dùng CPU (chậm hơn)
```

---

## 📝 Các Bước Tiếp Theo

### Tuần 1-2:
1. ✅ Setup project (bạn đã xong)
2. 📌 Chạy Docker Compose
3. 📌 Test APIs via Swagger UI
4. 📌 Build login page (Frontend)

### Tuần 3:
5. 📌 Implement gesture recognition
6. 📌 Train ML model trên dataset TTNM
7. 📌 Connect frontend camera to API

### Tuần 4-5:
8. 📌 Build chat feature
9. 📌 Create lesson/vocabulary system
10. 📌 Integration testing

### Tuần 6+:
11. 📌 Performance optimization
12. 📌 Deploy to cloud
13. 📌 Monitoring & maintenance

---

## 🔗 Tài Liệu Thêm

- [README.md](README.md) - Project overview
- [INSTALLATION.md](INSTALLATION.md) - Detailed installation
- [STRUCTURE.md](STRUCTURE.md) - Project structure
- [API.md](API.md) - Complete API docs
- [ML-GUIDE.md](ML-GUIDE.md) - ML pipeline guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide

---

## 💡 Tips & Best Practices

### Frontend
✅ Sử dụng Tailwind CSS cho styling  
✅ Component reusable và modular  
✅ Xử lý loading/error states  
✅ Cache API responses khi có thể  

### Backend
✅ Input validation với Pydantic  
✅ Error handling đúng HTTP status codes  
✅ Logging cho debugging  
✅ Rate limiting để prevent abuse  

### ML
✅ Data augmentation để improve accuracy  
✅ Cross-validation cho better results  
✅ Monitor model performance  
✅ Regular retraining với new data  

### DevOps
✅ Environment variables cho secrets  
✅ Automated testing (CI)  
✅ Monitoring & alerting  
✅ Backup database regularly  

---

## ❓ Cần Giúp?

Nếu có vấn đề:
1. Kiểm tra Troubleshooting section
2. Xem logs: `docker-compose logs -f`
3. Kiểm tra API docs: http://localhost:8000/docs
4. Review GitHub issues

---

**Happy Coding! 🚀**

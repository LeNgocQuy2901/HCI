# Sign Language Interpreter - Full Stack Application

## 📋 Project Overview

Sign Language Interpreter là một nền tảng web toàn diện giúp:
- 🎥 Nhận diện ký hiệu tay theo thời gian thực
- 📚 Học ngôn ngữ ký hiệu
- 💬 Giao tiếp trong chat rooms
- ✅ Kiểm tra kiến thức qua quizzes
- 👤 Quản lý hồ sơ cá nhân

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Socket.IO** - Real-time communication

### Backend
- **Python** - Programming language
- **FastAPI** - Web framework
- **PostgreSQL** - Main database
- **MongoDB** - Document database
- **Redis** - Caching

### Machine Learning
- **MediaPipe** - Hand gesture detection
- **TensorFlow** - Deep learning
- **OpenCV** - Computer vision

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 📁 Project Structure

```
sign-language-app/
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── utils/           # Utility functions
│   ├── public/              # Static files
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── controllers/     # Route controllers
│   │   └── config.py        # Configuration
│   ├── main.py              # FastAPI entry point
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile
│   └── .env.example
│
├── ml-service/              # Machine Learning service
│   ├── gesture_recognizer.py
│   ├── utils/
│   │   ├── preprocessor.py
│   │   └── trainer.py
│   ├── models/              # Trained models
│   ├── data/                # Dataset
│   └── requirements.txt
│
├── docker-compose.yml       # Container orchestration
└── .env.example
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Clone Repository
```bash
cd d:/GitHub/HCL
```

### 2. Setup Environment Variables

**Backend (.env)**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

**Frontend (.env)**
```bash
cd ../frontend
cp .env.example .env
```

### 3. Run with Docker Compose (Recommended)

```bash
# From project root
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend frontend
```

Services will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- MongoDB: localhost:27017
- Redis: localhost:6379

### 4. Manual Setup (Without Docker)

**Backend Setup:**
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
python main.py
```

**Frontend Setup:**
```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh JWT token

### Gesture Recognition
- `POST /api/gesture/recognize` - Recognize gesture from image
- `GET /api/gesture/list` - List all gestures
- `POST /api/gesture/train` - Train model with new data

### Chat
- `GET /api/chat/messages/{user_id}` - Get chat messages
- `POST /api/chat/send` - Send message
- `GET /api/chat/rooms` - Get chat rooms
- `POST /api/chat/rooms/create` - Create chat room

### Learning
- `GET /api/learn/lessons` - Get all lessons
- `GET /api/learn/lesson/{lesson_id}` - Get lesson details
- `POST /api/learn/quiz` - Submit quiz answers
- `GET /api/learn/vocabulary` - Get vocabulary

### Profile
- `GET /api/profile/me` - Get user profile
- `PUT /api/profile/update` - Update profile
- `GET /api/profile/saved-words` - Get saved words
- `GET /api/profile/statistics` - Get user statistics

## 🤖 Machine Learning

### Gesture Recognition Model

Dataset: TTNM (36 classes: 0-9, A-Z, _)

**Model Architecture:**
```
Input (Landmark Features)
    ↓
Dense Layer (256 units) + ReLU + Dropout
    ↓
Dense Layer (128 units) + ReLU + Dropout
    ↓
Output Layer (36 units) + Softmax
```

**Training:**
```bash
cd ml-service
python -m training.train --dataset-path ../datasetTTNM --epochs 100
```

## 🗄️ Database Schema

### PostgreSQL Tables
- `users` - User information
- `gestures` - Gesture definitions
- `user_lessons` - User learning progress
- `quiz_scores` - User quiz scores

### MongoDB Collections
- `chat_messages` - Chat history
- `saved_words` - User's saved vocabulary
- `user_feedback` - User feedback

## 📱 Features Implementation

### Phase 1: MVP (In Progress)
- ✅ Project setup with Docker
- ✅ Database configuration
- ⏳ Real-time gesture recognition
- ⏳ Basic CRUD operations

### Phase 2: Core Features
- 📋 Text-to-sign translation
- 📋 User authentication
- 📋 Vocabulary management

### Phase 3: Social & Learning
- 📋 Real-time chat
- 📋 Quiz system
- 📋 Leaderboard

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/

# Frontend tests
cd frontend
npm run test

# Coverage
pytest --cov=app tests/
```

## 📖 Documentation

- [API Documentation](./docs/API.md)
- [ML Model Guide](./docs/ML_MODEL.md)
- [Installation Guide](./docs/INSTALLATION.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/feature-name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/feature-name`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👥 Authors

- Development Team
- Contributors

## 📞 Support

For issues and questions:
- Open GitHub Issue
- Contact: support@signlanguageinterpreter.com
- Documentation: https://docs.signlanguageinterpreter.com

## 🙏 Acknowledgments

- MediaPipe for hand detection
- TensorFlow team for ML framework
- TTNM dataset for gesture data

---

**Last Updated:** March 31, 2026

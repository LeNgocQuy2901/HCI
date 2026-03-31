# Project Structure Documentation

## Complete Directory Layout

```
sign-language-app/
│
├── frontend/                           # React.js Frontend Application
│   ├── src/
│   │   ├── components/                 # Reusable React components
│   │   │   ├── Navbar.jsx             # Navigation bar
│   │   │   ├── GestureCamera.jsx      # Camera component
│   │   │   ├── ChatWidget.jsx         # Chat interface
│   │   │   └── [...other components]
│   │   │
│   │   ├── pages/                      # Page-level components
│   │   │   ├── Home.jsx               # Home page
│   │   │   ├── RecognitionPage.jsx    # Gesture recognition
│   │   │   ├── LearnPage.jsx          # Learning module
│   │   │   └── [...other pages]
│   │   │
│   │   ├── services/                   # API & external services
│   │   │   ├── api.js                 # Axios instance & API calls
│   │   │   ├── socketService.js       # WebSocket service
│   │   │   └── storageService.js      # LocalStorage helpers
│   │   │
│   │   ├── utils/                      # Utility functions
│   │   │   ├── formatters.js
│   │   │   ├── validators.js
│   │   │   └── constants.js
│   │   │
│   │   ├── App.jsx                     # Root component
│   │   ├── main.jsx                    # Entry point
│   │   ├── App.css                     # App styles
│   │   └── index.css                   # Global styles
│   │
│   ├── public/                         # Static assets
│   │   └── [static files]
│   │
│   ├── index.html                      # HTML template
│   ├── package.json                    # NPM dependencies
│   ├── vite.config.js                  # Vite configuration
│   ├── tailwind.config.js              # Tailwind setup
│   ├── postcss.config.js               # PostCSS configuration
│   ├── .env.example                    # Environment template
│   └── Dockerfile                      # Docker configuration
│
├── backend/                            # Python FastAPI Backend
│   ├── app/
│   │   ├── models/                     # Database ORM models
│   │   │   ├── user_model.py          # User model
│   │   │   ├── gesture_model.py       # Gesture model
│   │   │   ├── lesson_model.py        # Lesson model
│   │   │   └── __init__.py
│   │   │
│   │   ├── schemas/                    # Pydantic validation schemas
│   │   │   ├── user_schema.py         # User schemas
│   │   │   ├── gesture_schema.py      # Gesture schemas
│   │   │   └── __init__.py
│   │   │
│   │   ├── routes/                     # API endpoints
│   │   │   ├── auth.py                # Auth routes
│   │   │   ├── gesture.py             # Gesture routes
│   │   │   ├── chat.py                # Chat routes
│   │   │   ├── learn.py               # Learning routes
│   │   │   ├── profile.py             # Profile routes
│   │   │   └── __init__.py
│   │   │
│   │   ├── services/                   # Business logic
│   │   │   ├── database.py            # PostgreSQL connection
│   │   │   ├── mongodb.py             # MongoDB connection
│   │   │   ├── redis_service.py       # Redis service
│   │   │   ├── auth_service.py        # Authentication logic
│   │   │   ├── gesture_service.py     # Gesture logic
│   │   │   └── __init__.py
│   │   │
│   │   ├── controllers/                # Route handlers
│   │   │   ├── auth_controller.py
│   │   │   ├── gesture_controller.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── config.py                   # Configuration management
│   │   └── __init__.py
│   │
│   ├── tests/                          # Unit & integration tests
│   │   ├── test_auth.py
│   │   ├── test_gesture.py
│   │   └── conftest.py
│   │
│   ├── main.py                         # FastAPI application entry
│   ├── requirements.txt                # Python dependencies
│   ├── .env.example                    # Environment template
│   ├── Dockerfile                      # Docker configuration
│   ├── docker-compose.yml              # (in root)
│   └── .gitignore
│
├── ml-service/                         # ML + Gesture Recognition
│   ├── gesture_recognizer.py          # Main recognition class
│   │
│   ├── utils/
│   │   ├── preprocessor.py            # Data preprocessing
│   │   ├── trainer.py                 # Model training
│   │   ├── evaluator.py               # Model evaluation
│   │   └── __init__.py
│   │
│   ├── models/                         # Trained model files
│   │   ├── gesture_model.h5           # Trained weights
│   │   └── label_encoder.pkl          # Label mapping
│   │
│   ├── data/                           # Training data
│   │   ├── train/
│   │   ├── validation/
│   │   └── test/
│   │
│   ├── scripts/                        # Training scripts
│   │   ├── train_model.py
│   │   ├── evaluate_model.py
│   │   └── prepare_dataset.py
│   │
│   ├── requirements.txt
│   ├── __main__.py
│   └── README.md
│
├── docs/                               # Documentation
│   ├── INSTALLATION.md                # Setup guide
│   ├── API.md                         # API documentation
│   ├── ML_MODEL.md                    # ML model guide
│   ├── DEVELOPMENT.md                 # Development guide
│   ├── ARCHITECTURE.md                # System architecture
│   └── CONTRIBUTING.md                # Contributing guidelines
│
├── scripts/                            # Utility scripts
│   ├── setup.sh                       # Initial setup
│   ├── migrate.sh                     # Database migration
│   └── deploy.sh                      # Deployment script
│
├── .github/                            # GitHub configuration
│   └── workflows/
│       ├── ci.yml                     # CI/CD pipeline
│       └── deploy.yml                 # Deployment workflow
│
├── docker-compose.yml                  # Multi-container setup
├── .env.example                        # Root environment template
├── .gitignore                          # Git ignore rules
├── README.md                           # Project README
├── LICENSE                             # MIT License
└── CONTRIBUTING.md                    # Contributing guidelines
```

## Key Directories Explained

### `/frontend`
React application with Vite build tool
- Handles UI/UX
- Real-time gesture camera
- Chat interface
- Learning modules

### `/backend`
FastAPI REST API server
- User authentication
- Gesture API
- Database operations
- WebSocket support

### `/ml-service`
Machine learning & gesture recognition
- Gesture detection
- Model training
- Data preprocessing
- Inference

### `/docs`
Comprehensive documentation
- Setup guides
- API reference
- Architecture diagrams
- Contributing rules

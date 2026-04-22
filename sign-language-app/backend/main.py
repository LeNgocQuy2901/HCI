from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import logging
from app.routes import auth, gesture, chat, learn, profile, admin_learning
from app.services.database import init_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Sign Language Interpreter API",
    description="API for sign language recognition and learning",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "*"]
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    logger.info("Starting up application...")
    await init_db()
    logger.info("Database initialized")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(gesture.router, prefix="/api/gesture", tags=["gesture"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(learn.router, prefix="/api/learn", tags=["learn"])
app.include_router(admin_learning.router, prefix="/api", tags=["admin"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "healthy",
        "message": "Sign Language Interpreter API is running"
    }

# Root endpoint
@app.get("/", tags=["root"])
async def root():
    return {
        "message": "Welcome to Sign Language Interpreter API",
        "docs": "/docs",
        "openapi_schema": "/openapi.json"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

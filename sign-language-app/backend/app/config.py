import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from typing import Optional

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    # Application
    app_name: str = "Sign Language Interpreter API"
    app_version: str = "1.0.0"
    environment: str = os.getenv("ENVIRONMENT", "development")
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    
    # Database - PostgreSQL
    database_url: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/sign_language_db")
    sqlalchemy_echo: bool = os.getenv("SQLALCHEMY_ECHO", "true").lower() == "true"
    
    # Database - MongoDB
    mongo_url: str = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    mongo_database: str = os.getenv("MONGO_DATABASE", "sign_language_mongodb")
    
    # JWT
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_expiration_hours: int = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
    
    # Server
    backend_host: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    backend_port: int = int(os.getenv("BACKEND_PORT", "8000"))
    backend_reload: bool = os.getenv("BACKEND_RELOAD", "true").lower() == "true"
    
    # Frontend URL
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # File Upload
    max_upload_size: str = os.getenv("MAX_UPLOAD_SIZE", "10MB")
    upload_dir: str = os.getenv("UPLOAD_DIR", "./uploads")
    
    # ML Model
    model_path: str = os.getenv("MODEL_PATH", "./ml-service/models")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Create settings instance
settings = Settings()

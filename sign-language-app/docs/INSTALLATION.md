# Installation Guide

## Quick Start

### Using Docker Compose (Recommended)

1. **Prerequisites:**
   - Docker Desktop installed
   - Git installed

2. **Clone and setup:**
```bash
cd d:/GitHub/HCL/sign-language-app
docker-compose up -d
```

3. **Access services:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Manual Installation

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy .env file
cp .env.example .env

# Run migrations (if needed)
# python -m alembic upgrade head

# Start server
python main.py
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start dev server
npm run dev
```

## Database Setup

### PostgreSQL
```bash
# If using Docker, already set up
# If manual:
createdb sign_language_db
```

### MongoDB
```bash
# If using Docker, already set up
# If manual:
mongod --version  # check installation
```

### Redis
```bash
# If using Docker, already set up
# If manual (Windows):
# Download from: https://github.com/microsoftarchive/redis/releases

# macOS:
brew install redis
redis-server

# Linux:
sudo apt-get install redis-server
redis-server
```

## Configuration

### Backend Configuration (.env)

```env
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=your-secret-key-change-in-prod

DATABASE_URL=postgresql://user:password@localhost:5432/sign_language_db
MONGO_URL=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379/0

FRONTEND_URL=http://localhost:5173
JWT_EXPIRATION_HOURS=24
```

### Frontend Configuration (.env)

```env
VITE_API_URL=http://localhost:8000/api
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :8000
kill -9 <PID>
```

### Database Connection Issues
- Ensure PostgreSQL/MongoDB are running
- Check DATABASE_URL in .env
- Verify network connectivity

### Permission Denied
```bash
# Fix permissions
chmod +x ./scripts/*.sh
```

## Next Steps

1. Read [API Documentation](./API.md)
2. Check [Development Guide](./DEVELOPMENT.md)
3. Review [ML Model Guide](./ML_MODEL.md)


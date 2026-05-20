@echo off
REM Start FastAPI inference server
echo.
echo ========================================
echo ^♫ Sign Language Recognition API Server
echo ========================================
echo.

cd /d "%~dp0"

echo Checking model file...
if not exist "model\gesture_model.h5" (
    echo ^^! Bidirectional gesture_model.h5 not found in model folder
    echo Please ensure model file exists
)

echo Checking dependencies...
python -c "import fastapi, uvicorn, cv2, tensorflow, mediapipe" >nul 2>&1
if errorlevel 1 (
    echo ^^! Installing dependencies...
    call install-dependencies.bat
)

echo.
echo ^✓ All dependencies ready
echo.
echo ^♫ Starting server on http://0.0.0.0:8000
echo.
echo ^♫ API Documentation:
echo    - Swagger UI: http://localhost:8000/docs
echo    - ReDoc: http://localhost:8000/redoc
echo    - Health Check: http://localhost:8000/health
echo.
echo ^♫ Tips:
echo    - Press Ctrl+C to stop the server
echo    - Open http://localhost:5173/recognition in browser
echo    - Make hand gestures in front of camera
echo.
echo ========================================
echo.

python -m uvicorn inference.main:app --host 0.0.0.0 --port 8000 --reload

pause

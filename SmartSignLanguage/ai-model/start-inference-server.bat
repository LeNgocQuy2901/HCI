@echo off
REM Start FastAPI inference server
echo.
echo ========================================
echo SmartSignLanguage WLASL Recognition API
echo ========================================
echo.

cd /d "%~dp0"

echo Checking WLASL model files...
if not exist "model\model_landmarks.keras" (
    echo ! model_landmarks.keras not found in ai-model\model
)
if not exist "model\mapping.json" (
    echo ! mapping.json not found in ai-model\model
)
if not exist "model\model_number.keras" (
    echo ! model_number.keras not found in ai-model\model
)
if not exist "model\mapping_number.json" (
    echo ! mapping_number.json not found in ai-model\model
)
if not exist "model\hand_landmarker.task" (
    echo ! hand_landmarker.task not found in ai-model\model
)
if not exist "model\pose_landmarker.task" (
    echo ! pose_landmarker.task not found in ai-model\model
)

echo Checking dependencies...
python -c "import fastapi, uvicorn, cv2, tensorflow, mediapipe" >nul 2>&1
if errorlevel 1 (
    echo ! Installing dependencies...
    call install-dependencies.bat
)

echo.
echo Dependencies ready
echo.
echo Starting server on http://0.0.0.0:8000
echo.
echo API Documentation:
echo    - Swagger UI: http://localhost:8000/docs
echo    - ReDoc: http://localhost:8000/redoc
echo    - Health Check: http://localhost:8000/health
echo.
echo Tips:
echo    - Press Ctrl+C to stop the server
echo    - Open http://localhost:5173/recognition in browser
echo    - Supported modes: words, alnum, numbers
echo    - Keep the sign visible for at least 20 frames before reading the result
echo.
echo ========================================
echo.

python -m uvicorn inference.main:app --host 0.0.0.0 --port 8000 --reload

pause

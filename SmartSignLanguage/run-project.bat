@echo off
setlocal

set "APP_DIR=%~dp0"
set "AI_DIR=%APP_DIR%ai-model"
set "WEB_URL=http://localhost:8080"
set "AI_URL=http://localhost:8000/health"

echo.
echo ========================================
echo SmartSignLanguage - Run Project
echo ========================================
echo.

cd /d "%APP_DIR%"

if not exist "package.json" (
    echo [ERROR] package.json not found in %APP_DIR%
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
)

if not exist "%AI_DIR%\model\model_landmarks.keras" (
    echo [ERROR] Missing ai-model\model\model_landmarks.keras
    pause
    exit /b 1
)

if not exist "%AI_DIR%\model\mapping.json" (
    echo [ERROR] Missing ai-model\model\mapping.json
    pause
    exit /b 1
)

if not exist "%AI_DIR%\model\model_number.keras" (
    echo [ERROR] Missing ai-model\model\model_number.keras
    pause
    exit /b 1
)

if not exist "%AI_DIR%\model\mapping_number.json" (
    echo [ERROR] Missing ai-model\model\mapping_number.json
    pause
    exit /b 1
)

if not exist "%AI_DIR%\model\hand_landmarker.task" (
    echo [ERROR] Missing ai-model\model\hand_landmarker.task
    pause
    exit /b 1
)

if not exist "%AI_DIR%\model\pose_landmarker.task" (
    echo [ERROR] Missing ai-model\model\pose_landmarker.task
    pause
    exit /b 1
)

echo Starting AI server on http://localhost:8000 ...
start "SmartSignLanguage AI Server" cmd /k "cd /d ""%AI_DIR%"" && start-inference-server.bat"

echo Starting web app on http://localhost:8080 ...
start "SmartSignLanguage Web App" cmd /k "cd /d ""%APP_DIR%"" && npm run dev"

echo.
echo Waiting for servers to boot...
timeout /t 8 /nobreak >nul

echo.
echo Project is starting.
echo Web app:       %WEB_URL%
echo Recognition:   %WEB_URL%/recognition
echo AI health:     %AI_URL%
echo.
echo If the browser shows old code, press Ctrl+F5.
echo Close the two opened terminal windows to stop the project.
echo.

pause

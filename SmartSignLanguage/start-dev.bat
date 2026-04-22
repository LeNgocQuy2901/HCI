@echo off
REM Kích hoạt Virtual Environment và chạy npm dev

echo ============================================================
echo  Smart Sign Language - Development Environment Setup
echo ============================================================
echo.

echo Kích hoạt Virtual Environment...
call venv\Scripts\activate.bat

if errorlevel 1 (
    echo ERROR: Không thể kích hoạt venv!
    pause
    exit /b 1
)

echo ✓ Virtual Environment activated
echo.
echo Cài đặt npm dependencies...
call npm install --legacy-peer-deps

if errorlevel 1 (
    echo ERROR: npm install thất bại!
    pause
    exit /b 1
)

echo.
echo ✓ Dependencies installed
echo ✓ Environment ready!
echo.
echo Khởi động dev server...
echo ➜ Local:   http://localhost:8080/
echo ➜ Press Ctrl+C to stop
echo.
call npm run dev

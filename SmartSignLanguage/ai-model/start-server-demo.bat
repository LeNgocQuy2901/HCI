@echo off
REM Start inference server in demo mode (without model loading)
echo.
echo Starting Sign Language Recognition Server (DEMO MODE)...
echo.

cd /d D:\GitHub\HCL\ai-model

REM Set demo mode env variable
set DEMO_MODE=1

REM Run with Python directly (skip model loading)
python -m uvicorn inference.main:app --host 0.0.0.0 --port 8000 --reload

pause

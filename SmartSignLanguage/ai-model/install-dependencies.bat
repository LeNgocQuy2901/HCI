@echo off
REM Install Python dependencies for inference server

echo.
echo ========================================
echo ^♫ Installing Sign Language Recognition
echo    Inference Server dependencies...
echo ========================================
echo.

REM Upgrade pip
echo [1/4] Upgrading pip...
python -m pip install --upgrade pip

REM Install ONNX Runtime first (important for model loading)
echo [2/4] Installing ONNX Runtime...
python -m pip install onnxruntime>=1.17.0

REM Install ONNX
echo [3/4] Installing ONNX...
python -m pip install onnx>=1.13.0

REM Install all dependencies
echo [4/4] Installing other dependencies...
python -m pip install -r requirements.txt

echo.
echo ^✓ Installation complete
echo Ready to run: .\start-inference-server.bat
echo.
pause

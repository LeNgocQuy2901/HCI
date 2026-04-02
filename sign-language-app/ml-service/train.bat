@echo off
REM Quick training script for gesture recognition model
REM Usage: train.bat [epochs] [batch_size]

cd /d "%~dp0"

setlocal enabledelayedexpansion

set EPOCHS=%1
set BATCH_SIZE=%2
set DATASET=..\..\datasetTTNM

if "%EPOCHS%"=="" set EPOCHS=50
if "%BATCH_SIZE%"=="" set BATCH_SIZE=32

echo ==========================================
echo Gesture Model Training Script
echo ==========================================
echo Dataset: %DATASET%
echo Epochs: %EPOCHS%
echo Batch Size: %BATCH_SIZE%
echo.

REM Check if dataset exists
if not exist "%DATASET%" (
    echo ERROR: Dataset not found at %DATASET%
    echo Please provide correct path to datasetTTNM folder
    pause
    exit /b 1
)

REM Run training
python -m __main__ --train ^
    --dataset "%DATASET%" ^
    --epochs %EPOCHS% ^
    --batch-size %BATCH_SIZE% ^
    --augment

echo.
echo Training completed!
echo Check models\ folder for trained model files
pause

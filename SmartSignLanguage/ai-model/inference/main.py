"""
FastAPI server cho SmartSignLanguage.

Endpoints:
  POST /api/predict-base64     → WLASL 10-word gesture (model_landmarks.keras)
  POST /api/recognize-asl      → ASL Letter A-Z (ASL_detector_CNN.h5)  ← MỚI
  POST /api/predict            → WLASL (multipart file)
  POST /api/reset-sequence     → Reset sequence buffer của WLASL
  GET  /health                 → Status cả 2 model
  GET  /api/gestures           → Danh sách gesture WLASL
"""

from __future__ import annotations

import base64
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

import wlasl_landmark_pipeline as wlasl_pipeline
import asl_cnn_pipeline as asl_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def ai_model_dir() -> Path:
    return Path(__file__).resolve().parents[1]


def model_dir() -> Path:
    return ai_model_dir() / "model"


def hand_landmarker_path() -> Path:
    preferred = model_dir() / "hand_landmarker.task"
    if preferred.exists():
        return preferred
    fallback = model_dir() / "hand_landmarker (1).task"
    if fallback.exists():
        return fallback
    return preferred  # sẽ raise lỗi ở pipeline nếu cần


app = FastAPI(
    title="SmartSignLanguage Recognition API",
    description="ASL Letter (CNN) + WLASL Gesture (Landmark Keras)",
    version="6.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global model instances ────────────────────────────────────────────────────
wlasl_model: Optional[wlasl_pipeline.WlaslLandmarkSequenceModel] = None
asl_model: Optional[asl_pipeline.ASLCNNModel] = None


@app.on_event("startup")
def startup_event() -> None:
    global wlasl_model, asl_model

    assets = model_dir()

    # 1) Load WLASL model (10 từ)
    try:
        wlasl_model = wlasl_pipeline.WlaslLandmarkSequenceModel(
            model_path=assets / "model_landmarks.keras",
            mapping_path=assets / "mapping.json",
            hand_task_path=hand_landmarker_path(),
            pose_task_path=assets / "pose_landmarker.task",
        )
        logger.info("✅ WLASL model loaded")
    except Exception as e:
        logger.error("❌ WLASL model load failed: %s", e)
        wlasl_model = None

    # 2) Load ASL CNN model (A-Z)
    asl_model_path = assets / "ASL_detector_CNN.h5"
    if asl_model_path.exists():
        try:
            asl_model = asl_pipeline.ASLCNNModel(
                model_path=asl_model_path,
                hand_task_path=hand_landmarker_path() if hand_landmarker_path().exists() else None,
            )
            logger.info("✅ ASL CNN model loaded")
        except Exception as e:
            logger.error("❌ ASL CNN model load failed: %s", e)
            asl_model = None
    else:
        logger.warning(
            "⚠️  ASL_detector_CNN.h5 không tìm thấy tại %s — "
            "Download từ Kaggle và đặt vào thư mục model/",
            asl_model_path,
        )
        asl_model = None


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
def health_check() -> dict[str, Any]:
    return {
        "status": "healthy",
        # Frontend kiểm tra field này để hiển thị "ASL Model Ready"
        "asl_model_loaded": asl_model is not None,
        "wlasl_model_loaded": wlasl_model is not None,
        "asl_labels": asl_model.labels if asl_model else [],
        "wlasl_labels": wlasl_model.labels if wlasl_model else [],
        "timestamp": str(datetime.now()),
    }


# ── ASL Letter endpoint (Frontend gọi khi mode = "letter") ───────────────────
@app.post("/api/recognize-asl")
async def recognize_asl(data: dict[str, Any]) -> dict[str, Any]:
    """
    Nhận dạng chữ cái ASL A-Z từ 1 frame.
    Body: { "image": "data:image/jpeg;base64,..." }
    """
    if asl_model is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "ASL CNN model chưa được load. "
                "Hãy đặt file ASL_detector_CNN.h5 vào thư mục ai-model/model/ "
                "và restart server."
            ),
        )

    base64_str = data.get("image", "")
    if not base64_str:
        raise HTTPException(status_code=400, detail="Thiếu field 'image'")

    try:
        return asl_model.predict_base64(base64_str)
    except Exception as exc:
        logger.error("ASL predict error: %s", exc, exc_info=True)
        return asl_pipeline.response("error", f"Prediction failed: {exc}")


# ── WLASL endpoints (giữ nguyên) ─────────────────────────────────────────────
@app.post("/api/predict")
async def predict(file: UploadFile = File(...)) -> dict[str, Any]:
    if wlasl_model is None:
        raise HTTPException(status_code=503, detail="WLASL model chưa được load")
    try:
        image_bgr = wlasl_pipeline.image_bytes_to_bgr(await file.read())
        return wlasl_model.predict(image_bgr)
    except Exception as exc:
        logger.error("WLASL predict error: %s", exc, exc_info=True)
        return wlasl_pipeline.response("error", f"Prediction failed: {exc}")


@app.post("/api/predict-base64")
async def predict_base64(data: dict[str, Any]) -> dict[str, Any]:
    if wlasl_model is None:
        raise HTTPException(status_code=503, detail="WLASL model chưa được load")
    try:
        base64_str = data.get("image", "")
        if not base64_str:
            raise ValueError("Thiếu field 'image'")
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]
        image_bgr = wlasl_pipeline.image_bytes_to_bgr(base64.b64decode(base64_str))
        return wlasl_model.predict(image_bgr)
    except Exception as exc:
        logger.error("WLASL base64 predict error: %s", exc, exc_info=True)
        return wlasl_pipeline.response("error", f"Prediction failed: {exc}")


@app.post("/api/reset-sequence")
def reset_sequence() -> dict[str, Any]:
    if wlasl_model is None:
        raise HTTPException(status_code=503, detail="WLASL model chưa được load")
    wlasl_model.reset()
    return {"status": "success", "frames_ready": 0}


@app.get("/api/gestures")
def list_gestures() -> dict[str, Any]:
    if wlasl_model is None:
        raise HTTPException(status_code=503, detail="WLASL model chưa được load")
    return {
        "gestures": wlasl_model.labels,
        "count": len(wlasl_model.labels),
        "model": wlasl_model.name,
    }


@app.get("/api/info")
def get_info() -> dict[str, Any]:
    return {
        "version": "6.0.0",
        "asl_model": asl_model.name if asl_model else None,
        "wlasl_model": wlasl_model.name if wlasl_model else None,
        "endpoints": [
            "POST /api/recognize-asl   — ASL A-Z (CNN)",
            "POST /api/predict-base64  — WLASL gesture (sequence)",
            "POST /api/predict         — WLASL gesture (multipart)",
            "POST /api/reset-sequence  — Reset WLASL buffer",
            "GET  /health",
            "GET  /api/gestures",
            "GET  /api/info",
        ],
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
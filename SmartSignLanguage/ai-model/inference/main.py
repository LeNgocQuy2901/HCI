"""
FastAPI wrapper for the WLASL 10-word landmark sequence model.

The model in ai-model/model/model_landmarks.keras expects a rolling sequence of
20 frames, each with 225 MediaPipe features: left hand, right hand, and pose.
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

from inference import wlasl_landmark_pipeline as pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def ai_model_dir() -> Path:
    return Path(__file__).resolve().parents[1]


def model_dir() -> Path:
    return ai_model_dir() / "model"


def hand_landmarker_path() -> Path:
    preferred = model_dir() / "hand_landmarker.task"
    if preferred.exists():
        return preferred
    return model_dir() / "hand_landmarker (1).task"


app = FastAPI(
    title="SmartSignLanguage WLASL Recognition API",
    description="Realtime 10-word ASL recognition using MediaPipe hands+pose landmarks and Keras",
    version="5.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model: Optional[pipeline.WlaslLandmarkSequenceModel] = None


@app.on_event("startup")
def startup_event() -> None:
    global model

    assets_dir = model_dir()
    model = pipeline.WlaslLandmarkSequenceModel(
        assets_dir / "model_landmarks.keras",
        assets_dir / "mapping.json",
        hand_landmarker_path(),
        assets_dir / "pose_landmarker.task",
    )


@app.get("/health")
def health_check() -> dict[str, Any]:
    return {
        "status": "healthy" if model is not None else "unhealthy",
        "backend": "wlasl-hands-pose-sequence",
        "model_loaded": model is not None,
        "model": model.name if model else "none",
        "model_path": str(model.model_path) if model else "",
        "mapping_path": str(model.mapping_path) if model else "",
        "hand_landmarker_path": str(model.hand_task_path) if model else "",
        "pose_landmarker_path": str(model.pose_task_path) if model else "",
        "num_gestures": len(model.labels) if model else 0,
        "gestures": model.labels if model else [],
        "sequence_length": model.sequence_length if model else pipeline.SEQ_LEN,
        "frames_ready": len(model.sequence) if model else 0,
        "tensorflow_available": pipeline.TENSORFLOW_AVAILABLE,
        "mediapipe_available": pipeline.MEDIAPIPE_AVAILABLE,
        "mediapipe_backend": model.extractor.backend if model else "",
        "timestamp": str(datetime.now()),
    }


@app.post("/api/predict")
async def predict(file: UploadFile = File(...)) -> dict[str, Any]:
    if model is None:
        raise HTTPException(status_code=503, detail="WLASL landmark model is not initialized")

    try:
        image_bgr = pipeline.image_bytes_to_bgr(await file.read())
        return model.predict(image_bgr)
    except Exception as exc:
        logger.error("Prediction error: %s", exc, exc_info=True)
        return pipeline.response("error", f"Prediction failed: {exc}")


@app.post("/api/predict-base64")
async def predict_base64(data: dict[str, Any]) -> dict[str, Any]:
    if model is None:
        raise HTTPException(status_code=503, detail="WLASL landmark model is not initialized")

    try:
        base64_str = data.get("image")
        if not base64_str:
            raise ValueError("No image provided")
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]

        image_bgr = pipeline.image_bytes_to_bgr(base64.b64decode(base64_str))
        return model.predict(image_bgr)
    except Exception as exc:
        logger.error("Base64 prediction error: %s", exc, exc_info=True)
        return pipeline.response("error", f"Prediction failed: {exc}")


@app.post("/api/batch-predict")
async def batch_predict(files: list[UploadFile] = File(...)) -> dict[str, Any]:
    if model is None:
        raise HTTPException(status_code=503, detail="WLASL landmark model is not initialized")

    results = []
    for file in files:
        try:
            prediction = model.predict(pipeline.image_bytes_to_bgr(await file.read()))
            prediction["file"] = file.filename
            results.append(prediction)
        except Exception as exc:
            results.append({"file": file.filename, "error": str(exc)})

    return {"results": results}


@app.post("/api/reset-sequence")
def reset_sequence() -> dict[str, Any]:
    if model is None:
        raise HTTPException(status_code=503, detail="WLASL landmark model is not initialized")

    model.reset()
    return {"status": "success", "frames_ready": 0}


@app.get("/api/gestures")
def list_gestures() -> dict[str, Any]:
    if model is None:
        raise HTTPException(status_code=503, detail="WLASL landmark model is not initialized")

    return {
        "gestures": model.labels,
        "count": len(model.labels),
        "model": model.name,
        "training_metadata": model.metadata_summary(),
    }


@app.get("/api/info")
def get_info() -> dict[str, Any]:
    return {
        "name": "SmartSignLanguage WLASL Recognition API",
        "version": "5.0.0",
        "backend": "wlasl-hands-pose-sequence",
        "model_loaded": model is not None,
        "model": model.name if model else "none",
        "num_gestures": len(model.labels) if model else 0,
        "training_metadata": model.metadata_summary() if model else {},
        "supported_formats": ["image/jpeg", "image/png"],
        "endpoints": [
            "/health",
            "/api/predict",
            "/api/predict-base64",
            "/api/batch-predict",
            "/api/reset-sequence",
            "/api/gestures",
            "/api/info",
        ],
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

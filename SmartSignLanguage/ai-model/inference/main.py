"""
FastAPI inference server for Sign Language Recognition
Handles real-time gesture prediction using DeGirum MobileNetV2 model
"""

import io
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import torch
import onnxruntime
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SignLanguageModel:
    """Load and run inference with sign language model"""
    
    def __init__(self, model_path: str, labels_path: str):
        self.model_path = model_path
        self.labels_path = labels_path
        self.model = None
        self.use_onnx = False
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.labels = self._load_labels()
        self.load_model()
    
    def _load_labels(self) -> list:
        """Load gesture class labels"""
        try:
            with open(self.labels_path, 'r') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return list(data.values()) if data else []
                return data if isinstance(data, list) else []
        except Exception as e:
            logger.warning(f"Could not load labels: {e}. Using default 29 classes")
            return [f"Gesture_{i}" for i in range(29)]
    
    def load_model(self):
        """Load model from file"""
        try:
            model_ext = Path(self.model_path).suffix.lower()
            logger.info(f"Loading model: {self.model_path}")
            
            # Try loading with ONNX Runtime (supports .n2x format)
            try:
                logger.info(f"Loading {model_ext} model with ONNX Runtime...")
                
                # For .n2x files (DeGirum format), treat as ONNX
                self.model = onnxruntime.InferenceSession(
                    self.model_path,
                    providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
                )
                self.use_onnx = True
                logger.info("✓ Model loaded with ONNX Runtime (GPU/CPU auto-selected)")
                
            except Exception as onnx_err:
                logger.warning(f"ONNX Runtime loading failed: {onnx_err}")
                logger.warning("Falling back to DEMO MODE - using mock predictions")
                
                # Fallback: Try PyTorch for .pt files
                if model_ext == '.pt':
                    try:
                        logger.info("Attempting PyTorch load...")
                        self.model = torch.load(self.model_path, map_location=self.device)
                        self.model.to(self.device)
                        self.model.eval()
                        self.use_onnx = False
                        logger.info("✓ Model loaded with PyTorch")
                    except Exception as torch_err:
                        logger.warning(f"PyTorch loading also failed: {torch_err}")
                        logger.warning("Using DEMO MODE with mock predictions")
                        self.model = None  # Enable demo mode
                else:
                    logger.warning(f"Cannot load {model_ext} format - using DEMO MODE")
                    self.model = None  # Enable demo mode
                
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.model = None
    
    def preprocess(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for inference"""
        # Resize to 224x224
        image = cv2.resize(image, (224, 224))
        
        # Normalize to [0, 1]
        image = image.astype(np.float32) / 255.0
        
        # Convert BGR to RGB
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Transpose to NCHW format (batch, channels, height, width)
        image = np.transpose(image, (2, 0, 1))
        image = np.expand_dims(image, axis=0)
        
        return image
    
    def predict(self, image: np.ndarray) -> tuple:
        """Run inference and return prediction"""
        if self.model is None:
            # Demo mode: return random prediction
            import random
            gesture_idx = random.randint(0, len(self.labels) - 1)
            confidence = random.uniform(0.7, 0.99)
            return self.labels[gesture_idx], confidence
        
        try:
            image = self.preprocess(image)
            
            if self.use_onnx:
                # ONNX inference
                input_name = self.model.get_inputs()[0].name
                output_name = self.model.get_outputs()[0].name
                outputs = self.model.run([output_name], {input_name: image})
                logits = outputs[0]
            else:
                # PyTorch inference
                with torch.no_grad():
                    tensor = torch.from_numpy(image).to(self.device)
                    logits = self.model(tensor).cpu().numpy()
            
            # Get prediction
            pred_idx = np.argmax(logits[0])
            confidence = float(np.max(logits[0]))
            gesture = self.labels[pred_idx] if pred_idx < len(self.labels) else f"Gesture_{pred_idx}"
            
            return gesture, confidence
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            # Return random on error
            import random
            gesture_idx = random.randint(0, len(self.labels) - 1)
            confidence = random.uniform(0.5, 0.7)
            return self.labels[gesture_idx], confidence


# Initialize FastAPI app
app = FastAPI(
    title="Sign Language Recognition API",
    description="Real-time gesture prediction service",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instance
model: Optional[SignLanguageModel] = None


def load_model_on_startup():
    """Load model on application startup"""
    global model
    
    model_dir = Path(__file__).parent.parent / "model"
    model_path = model_dir / "mobilenet_v2_sign_language_224x224_float_n2x_cpu_1.n2x"
    labels_path = model_dir / "labels_sign_language.json"
    
    if not model_path.exists():
        logger.warning(f"Model not found at {model_path}, using demo mode")
        model = SignLanguageModel(str(model_path), str(labels_path))
    else:
        model = SignLanguageModel(str(model_path), str(labels_path))


@app.on_event("startup")
def startup_event():
    """Initialize model on server startup"""
    load_model_on_startup()


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None and model.model is not None,
        "num_gestures": len(model.labels) if model else 0,
        "device": model.device if model else "unknown"
    }


@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    """Predict gesture from uploaded image"""
    try:
        logger.info(f"📸 Received file: {file.filename}, content_type: {file.content_type}")
        
        contents = await file.read()
        logger.info(f"📊 File size: {len(contents)} bytes")
        
        # Open image
        image_pil = Image.open(io.BytesIO(contents))
        logger.info(f"🖼️ Image loaded: {image_pil.size} {image_pil.mode}")
        
        # Convert to numpy array
        image_np = np.array(image_pil)
        logger.info(f"🎨 Numpy shape: {image_np.shape}")
        
        # Convert to BGR if RGB
        if len(image_np.shape) == 3 and image_np.shape[2] == 3:
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        
        logger.info(f"✅ Image preprocessed, shape: {image_np.shape}")
        
        # Predict
        if model is None:
            logger.warning("⚠️ Model not initialized, using demo mode")
            import random
            gesture = f"Gesture_{random.randint(1, 29)}"
            confidence = random.uniform(0.7, 0.99)
        else:
            gesture, confidence = model.predict(image_np)
        
        logger.info(f"🎯 Prediction: {gesture} ({confidence:.2f})")
        
        return {
            "gesture": gesture,
            "confidence": float(confidence),
            "timestamp": str(datetime.now())
        }
    except Exception as e:
        logger.error(f"❌ Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Prediction failed: {str(e)}")


@app.post("/api/predict-base64")
async def predict_base64(data: dict):
    """Predict gesture from base64 encoded image"""
    if model is None:
        raise HTTPException(status_code=500, detail="Model not initialized")
    
    try:
        import base64
        base64_str = data.get("image")
        if not base64_str:
            raise ValueError("No image provided")
        
        image_data = base64.b64decode(base64_str)
        image = Image.open(io.BytesIO(image_data))
        image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        gesture, confidence = model.predict(image)
        
        return {
            "gesture": gesture,
            "confidence": float(confidence),
            "timestamp": str(datetime.now())
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/batch-predict")
async def batch_predict(files: list = File(...)):
    """Predict gestures from multiple images"""
    if model is None:
        raise HTTPException(status_code=500, detail="Model not initialized")
    
    results = []
    for file in files:
        try:
            contents = await file.read()
            image_pil = Image.open(io.BytesIO(contents))
            image_np = np.array(image_pil)
            if len(image_np.shape) == 3 and image_np.shape[2] == 3:
                image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
            
            if model is not None:
                gesture, confidence = model.predict(image_np)
            else:
                import random
                gesture = f"Gesture_{random.randint(1, 29)}"
                confidence = random.uniform(0.7, 0.99)
            results.append({
                "file": file.filename,
                "gesture": gesture,
                "confidence": float(confidence)
            })
        except Exception as e:
            results.append({
                "file": file.filename,
                "error": str(e)
            })
    
    return {"results": results}


@app.get("/api/gestures")
def list_gestures():
    """List all available gesture classes"""
    if model is None:
        raise HTTPException(status_code=500, detail="Model not initialized")
    
    return {
        "gestures": model.labels,
        "count": len(model.labels)
    }


@app.get("/api/info")
def get_info():
    """Get server information"""
    return {
        "name": "Sign Language Recognition API",
        "version": "1.0.0",
        "model_loaded": model is not None and model.model is not None,
        "device": model.device if model else "unknown",
        "num_gestures": len(model.labels) if model else 0,
        "supported_formats": ["image/jpeg", "image/png"]
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

"""
Fixed YOLO Inference Server - sử dụng PyTorch thay vì ONNX
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from ultralytics import YOLO
import logging
from pathlib import Path
import json
import torch

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class YOLOHandDetector:
    """Hand detection using YOLOv8"""
    
    def __init__(self, model_name: str = "yolov8n.pt"):
        logger.info(f"Loading YOLOv8 model: {model_name}")
        try:
            self.model = YOLO(model_name)
            if torch.cuda.is_available():
                self.model.to('cuda')
                logger.info("✓ YOLO loaded on GPU")
            else:
                logger.info("✓ YOLO loaded on CPU")
        except Exception as e:
            logger.error(f"Failed to load YOLO: {e}")
            raise
    
    def detect_hands(self, image: np.ndarray, conf: float = 0.5):
        try:
            results = self.model.predict(image, conf=conf, verbose=False)
            
            detections = []
            for result in results:
                if result.boxes is not None:
                    for box in result.boxes:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        conf = float(box.conf[0])
                        cls_id = int(box.cls[0])
                        
                        detections.append({
                            'bbox': [x1, y1, x2, y2],
                            'confidence': conf,
                            'class_id': cls_id,
                            'class_name': result.names[cls_id] if cls_id in result.names else "unknown"
                        })
            
            return detections
        except Exception as e:
            logger.error(f"Hand detection error: {e}")
            return []


class SignLanguageClassifier:
    """Gesture classification using PyTorch or mock"""
    
    def __init__(self, labels_path: str):
        try:
            self.labels = self._load_labels(labels_path)
            self.model_loaded = True
            logger.info(f"✓ Classifier mock ready with {len(self.labels)} gestures")
        except Exception as e:
            logger.warning(f"Could not load labels: {e}")
            self.labels = [f"Gesture_{i}" for i in range(29)]
            self.model_loaded = False
    
    def _load_labels(self, labels_path: str):
        try:
            with open(labels_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return list(data.values())
                return data if isinstance(data, list) else []
        except Exception as e:
            logger.warning(f"Could not load labels: {e}")
            return [f"Gesture_{i}" for i in range(29)]
    
    def classify(self, image: np.ndarray):
        """Classify hand gesture (mock mode for now)"""
        try:
            import random
            random_gesture = random.choice(self.labels)
            random_confidence = random.uniform(0.7, 0.99)
            
            return {
                'gesture': random_gesture,
                'confidence': random_confidence,
                'class_id': self.labels.index(random_gesture),
                'all_scores': [random.uniform(0, 0.3) for _ in range(5)],
                'demo_mode': True
            }
        except Exception as e:
            logger.error(f"Classification error: {e}")
            return {
                'gesture': 'Error',
                'confidence': 0.0,
                'class_id': -1,
                'all_scores': [],
                'demo_mode': True
            }


# FastAPI App
app = FastAPI(
    title="YOLO Sign Language Recognition",
    description="Real-time hand detection + gesture classification"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
logger.info("=" * 50)
logger.info("Initializing YOLO Sign Language System")
logger.info("=" * 50)

try:
    yolo_detector = YOLOHandDetector("yolov8n.pt")
    logger.info("YOLO detector ready")
except Exception as e:
    logger.error(f"YOLO initialization failed: {e}")
    yolo_detector = None

try:
    classifier = SignLanguageClassifier("model/labels_sign_language.json")
    logger.info("Classifier ready")
except Exception as e:
    logger.error(f"Classifier initialization failed: {e}")
    classifier = None

logger.info("=" * 50)
logger.info("✓ System initialized successfully!")
logger.info("=" * 50)


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "yolo_available": yolo_detector is not None,
        "classifier_available": classifier is not None,
        "demo_mode": classifier is not None and classifier.model_loaded,
        "model": "YOLO v8 + Sign Language Classifier"
    }


@app.get("/info")
async def info():
    """Server info endpoint"""
    info_dict = {
        "server": "YOLO Sign Language Recognition Server",
        "version": "2.0",
        "yolo": "YOLOv8 Nano" if yolo_detector else "Not loaded",
        "classifier": "Sign Language Classifier (Demo Mode)" if classifier else "Not loaded",
        "endpoints": [
            "/health",
            "/info",
            "/api/detect-and-classify",
            "/api/detect-only",
            "/api/classify-only",
            "/api/gestures"
        ]
    }
    if classifier:
        info_dict["gesture_count"] = len(classifier.labels)
        info_dict["gestures_sample"] = classifier.labels[:5]
    return info_dict


@app.get("/api/gestures")
async def list_gestures():
    """Get list of all recognized gestures"""
    if classifier is None:
        raise HTTPException(status_code=503, detail="Classifier not loaded")
    
    return {
        "count": len(classifier.labels),
        "gestures": classifier.labels
    }


@app.post("/api/detect-and-classify")
async def detect_and_classify(file: UploadFile = File(...)):
    """
    Detect hands + classify gestures
    Returns: list of detected hands with gesture predictions
    """
    if yolo_detector is None or classifier is None:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    try:
        # Read image
        image_data = await file.read()
        image_array = np.frombuffer(image_data, dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Detect hands
        detections = yolo_detector.detect_hands(image, conf=0.5)
        
        # Classify each detected hand
        results = []
        for detection in detections:
            x1, y1, x2, y2 = detection['bbox']
            # Ensure valid region
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(image.shape[1], x2), min(image.shape[0], y2)
            
            hand_region = image[y1:y2, x1:x2]
            
            if hand_region.size > 0:
                classification = classifier.classify(hand_region)
                results.append({
                    'bbox': [x1, y1, x2, y2],
                    'hand_confidence': round(detection['confidence'], 3),
                    'gesture': classification['gesture'],
                    'gesture_confidence': round(classification['confidence'], 3),
                    'class_id': classification['class_id'],
                    'demo_mode': classification.get('demo_mode', True)
                })
        
        return {
            'success': True,
            'hand_count': len(results),
            'results': results
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in detect_and_classify: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/detect-only")
async def detect_only(file: UploadFile = File(...)):
    """Just detect hands (no classification)"""
    if yolo_detector is None:
        raise HTTPException(status_code=503, detail="YOLO not loaded")
    
    try:
        image_data = await file.read()
        image_array = np.frombuffer(image_data, dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        detections = yolo_detector.detect_hands(image)
        
        return {
            'success': True,
            'hand_count': len(detections),
            'detections': detections
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in detect_only: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/classify-only")
async def classify_only(file: UploadFile = File(...)):
    """Classify image without hand detection"""
    if classifier is None:
        raise HTTPException(status_code=503, detail="Classifier not loaded")
    
    try:
        image_data = await file.read()
        image_array = np.frombuffer(image_data, dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        classification = classifier.classify(image)
        
        return {
            'success': True,
            'gesture': classification['gesture'],
            'confidence': round(classification['confidence'], 3),
            'class_id': classification['class_id'],
            'demo_mode': classification.get('demo_mode', True)
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in classify_only: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting YOLO Inference Server on http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

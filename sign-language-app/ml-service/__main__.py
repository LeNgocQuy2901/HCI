import logging
import numpy as np
from pathlib import Path
from gesture_recognizer import GestureRecognizer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Main function for ML service"""
    logger.info("Initializing Gesture Recognizer...")
    
    recognizer = GestureRecognizer()
    logger.info("Gesture Recognizer initialized successfully")
    
    # Example: Process an image
    test_image_path = Path("data/test_image.jpg")
    if test_image_path.exists():
        import cv2
        frame = cv2.imread(str(test_image_path))
        gesture, confidence = recognizer.recognize_gesture(frame)
        logger.info(f"Recognized gesture: {gesture} (confidence: {confidence:.2f})")
    else:
        logger.info("No test image found. Gesture recognizer is ready for use.")

if __name__ == "__main__":
    main()

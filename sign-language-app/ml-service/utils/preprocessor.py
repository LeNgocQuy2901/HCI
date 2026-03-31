import cv2
import numpy as np
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class DataPreprocessor:
    """Data preprocessing for gesture recognition"""
    
    @staticmethod
    def load_image(image_path):
        """Load image from file"""
        try:
            image = cv2.imread(str(image_path))
            if image is None:
                raise ValueError(f"Failed to load image: {image_path}")
            return image
        except Exception as e:
            logger.error(f"Error loading image: {e}")
            return None
    
    @staticmethod
    def resize_image(image, size=(224, 224)):
        """Resize image to target size"""
        try:
            return cv2.resize(image, size)
        except Exception as e:
            logger.error(f"Error resizing image: {e}")
            return None
    
    @staticmethod
    def normalize_image(image):
        """Normalize image to [0, 1]"""
        try:
            return image.astype('float32') / 255.0
        except Exception as e:
            logger.error(f"Error normalizing image: {e}")
            return None
    
    @staticmethod
    def augment_image(image):
        """Augment image with random transformations"""
        try:
            # Random rotation
            angle = np.random.randint(-15, 15)
            h, w = image.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            image = cv2.warpAffine(image, M, (w, h))
            
            # Random brightness
            brightness = np.random.uniform(0.8, 1.2)
            image = cv2.convertScaleAbs(image, alpha=brightness, beta=0)
            
            # Random blur
            if np.random.random() > 0.7:
                image = cv2.GaussianBlur(image, (3, 3), 0)
            
            return image
        except Exception as e:
            logger.error(f"Error augmenting image: {e}")
            return image
    
    @staticmethod
    def preprocess_batch(image_paths, size=(224, 224)):
        """Preprocess batch of images"""
        images = []
        for image_path in image_paths:
            image = DataPreprocessor.load_image(image_path)
            if image is not None:
                image = DataPreprocessor.resize_image(image, size)
                image = DataPreprocessor.normalize_image(image)
                images.append(image)
        
        return np.array(images) if images else None

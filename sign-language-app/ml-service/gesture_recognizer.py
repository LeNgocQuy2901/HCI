import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class GestureRecognizer:
    """Gesture recognition using MediaPipe and TensorFlow"""
    
    def __init__(self, model_path=None):
        """Initialize gesture recognizer"""
        self.mp_holistic = mp.solutions.holistic
        self.mp_drawing = mp.solutions.drawing_utils
        self.holistic = self.mp_holistic.Holistic(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        
        # Gesture labels (0-9, A-Z, _)
        self.labels = [str(i) for i in range(10)] + [chr(i) for i in range(65, 91)] + ['_']
        
        # Try to load trained model
        self.model = None
        if model_path and Path(model_path).exists():
            self.load_model(model_path)
        
        logger.info(f"GestureRecognizer initialized with {len(self.labels)} gesture classes")
    
    def extract_landmarks(self, frame):
        """Extract landmarks from frame using MediaPipe"""
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.holistic.process(rgb_frame)
            
            landmarks = []
            
            # Extract hand landmarks
            if results.left_hand_landmarks:
                for landmark in results.left_hand_landmarks.landmark:
                    landmarks.extend([landmark.x, landmark.y, landmark.z])
            else:
                landmarks.extend([0] * 63)  # 21 landmarks * 3 coordinates
            
            if results.right_hand_landmarks:
                for landmark in results.right_hand_landmarks.landmark:
                    landmarks.extend([landmark.x, landmark.y, landmark.z])
            else:
                landmarks.extend([0] * 63)
            
            return np.array(landmarks)
        
        except Exception as e:
            logger.error(f"Error extracting landmarks: {e}")
            return None
    
    def recognize_gesture(self, frame):
        """Recognize gesture from frame"""
        try:
            landmarks = self.extract_landmarks(frame)
            
            if landmarks is None:
                return None, 0.0
            
            if self.model is None:
                # Return dummy result if model not loaded
                logger.warning("Model not loaded, returning dummy result")
                return self.labels[0], 0.5
            
            # Predict gesture
            landmarks = np.expand_dims(landmarks, axis=0)
            prediction = self.model.predict(landmarks, verbose=0)
            gesture_idx = np.argmax(prediction[0])
            confidence = float(prediction[0][gesture_idx])
            
            return self.labels[gesture_idx], confidence
        
        except Exception as e:
            logger.error(f"Error recognizing gesture: {e}")
            return None, 0.0
    
    def load_model(self, model_path):
        """Load trained model"""
        try:
            self.model = tf.keras.models.load_model(model_path)
            logger.info(f"Model loaded from {model_path}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
    
    def draw_landmarks(self, frame, results=None):
        """Draw landmarks on frame"""
        try:
            if results is None:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = self.holistic.process(rgb_frame)
            
            # Draw hand landmarks
            if results.left_hand_landmarks:
                self.mp_drawing.draw_landmarks(
                    frame,
                    results.left_hand_landmarks,
                    self.mp_holistic.HAND_CONNECTIONS
                )
            
            if results.right_hand_landmarks:
                self.mp_drawing.draw_landmarks(
                    frame,
                    results.right_hand_landmarks,
                    self.mp_holistic.HAND_CONNECTIONS
                )
            
            return frame
        
        except Exception as e:
            logger.error(f"Error drawing landmarks: {e}")
            return frame

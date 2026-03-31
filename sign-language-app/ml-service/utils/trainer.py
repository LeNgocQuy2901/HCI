import numpy as np
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class ModelTrainer:
    """Model training utilities"""
    
    @staticmethod
    def create_cnn_model(input_shape, num_classes):
        """Create CNN model for gesture recognition"""
        try:
            from tensorflow import keras
            from tensorflow.keras import layers
            
            model = keras.Sequential([
                layers.InputLayer(input_shape=input_shape),
                
                # Block 1
                layers.Conv2D(32, 3, padding='same', activation='relu'),
                layers.BatchNormalization(),
                layers.Conv2D(32, 3, padding='same', activation='relu'),
                layers.BatchNormalization(),
                layers.MaxPooling2D(2),
                layers.Dropout(0.25),
                
                # Block 2
                layers.Conv2D(64, 3, padding='same', activation='relu'),
                layers.BatchNormalization(),
                layers.Conv2D(64, 3, padding='same', activation='relu'),
                layers.BatchNormalization(),
                layers.MaxPooling2D(2),
                layers.Dropout(0.25),
                
                # Block 3
                layers.Conv2D(128, 3, padding='same', activation='relu'),
                layers.BatchNormalization(),
                layers.Conv2D(128, 3, padding='same', activation='relu'),
                layers.BatchNormalization(),
                layers.MaxPooling2D(2),
                layers.Dropout(0.25),
                
                # Fully connected layers
                layers.Flatten(),
                layers.Dense(256, activation='relu'),
                layers.BatchNormalization(),
                layers.Dropout(0.5),
                layers.Dense(128, activation='relu'),
                layers.BatchNormalization(),
                layers.Dropout(0.5),
                layers.Dense(num_classes, activation='softmax')
            ])
            
            logger.info(f"CNN model created with {num_classes} output classes")
            return model
        
        except Exception as e:
            logger.error(f"Error creating CNN model: {e}")
            return None
    
    @staticmethod
    def compile_model(model, learning_rate=0.001):
        """Compile model"""
        try:
            from tensorflow import keras
            
            optimizer = keras.optimizers.Adam(learning_rate=learning_rate)
            model.compile(
                optimizer=optimizer,
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )
            
            logger.info("Model compiled successfully")
            return model
        
        except Exception as e:
            logger.error(f"Error compiling model: {e}")
            return None

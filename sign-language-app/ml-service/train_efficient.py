"""
Efficient training script that handles large datasets with limited memory
Uses image generators to stream data during training
"""

import logging
import argparse
import sys
from pathlib import Path
from utils.dataset_loader import DatasetLoader
import numpy as np
import tensorflow as tf
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_efficient_model(input_shape=(224, 224, 3), num_classes=36):
    """Create a more memory-efficient model"""
    try:
        import tensorflow.keras as keras
        from tensorflow.keras import layers
    except ImportError:
        import keras
        from keras import layers
    
    model = keras.Sequential([
        layers.InputLayer(input_shape=input_shape),
        
        # Lighter architecture
        layers.Conv2D(32, 3, padding='same', activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D(2),
        layers.Dropout(0.25),
        
        layers.Conv2D(64, 3, padding='same', activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D(2),
        layers.Dropout(0.25),
        
        layers.Conv2D(128, 3, padding='same', activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D(2),
        layers.Dropout(0.25),
        
        layers.Flatten(),
        layers.Dense(256, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    return model


class EfficientGestureTrainer:
    """Train with memory-efficient data loading"""
    
    def __init__(self, dataset_path, model_output_dir="models", use_preprocessed=True):
        self.dataset_path = Path(dataset_path)
        self.model_output_dir = Path(model_output_dir)
        self.model_output_dir.mkdir(parents=True, exist_ok=True)
        self.dataset_loader = DatasetLoader(dataset_path, use_preprocessed)
        self.model = None
        
        logger.info("EfficientGestureTrainer initialized")
    
    def train_with_limited_data(self, max_images_per_label=200, epochs=5, batch_size=16):
        """Train with limited images per label"""
        logger.info("=" * 60)
        logger.info("Starting efficient training (limited data)")
        logger.info(f"Max images per label: {max_images_per_label}")
        logger.info("=" * 60)
        
        try:
            # Load limited dataset
            logger.info("Loading limited dataset...")
            X, y = self.dataset_loader.load_dataset(
                image_size=(224, 224),
                max_images_per_label=max_images_per_label,
                augment=False
            )
            
            if X.shape[0] == 0:
                logger.error("No images loaded!")
                return None
            
            logger.info(f"Dataset shape: {X.shape}")
            logger.info(f"Total images: {X.shape[0]}")
            
            # Split data
            logger.info("Splitting dataset...")
            X_train, X_val, X_test, y_train, y_val, y_test = \
                self.dataset_loader.split_dataset(X, y, test_size=0.15, val_size=0.15)
            
            logger.info(f"Training samples: {X_train.shape[0]}")
            logger.info(f"Validation samples: {X_val.shape[0]}")
            logger.info(f"Test samples: {X_test.shape[0]}")
            
            # Create and compile model
            logger.info("Creating model...")
            input_shape = (224, 224, 3)
            num_classes = len(self.dataset_loader.LABELS)
            
            self.model = create_efficient_model(input_shape, num_classes)
            self.model.compile(
                optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )
            
            logger.info("Model summary:")
            self.model.summary()
            
            # Callbacks
            callbacks = [
                tf.keras.callbacks.ModelCheckpoint(
                    str(self.model_output_dir / "best_model.h5"),
                    monitor='val_accuracy',
                    save_best_only=True,
                    verbose=1
                ),
                tf.keras.callbacks.EarlyStopping(
                    monitor='val_loss',
                    patience=3,
                    verbose=1
                ),
                tf.keras.callbacks.ReduceLROnPlateau(
                    monitor='val_loss',
                    factor=0.5,
                    patience=2,
                    verbose=1
                )
            ]
            
            # Train
            logger.info(f"Training for {epochs} epochs...")
            history = self.model.fit(
                X_train, y_train,
                batch_size=batch_size,
                epochs=epochs,
                validation_data=(X_val, y_val),
                callbacks=callbacks,
                verbose=1
            )
            
            # Evaluate
            logger.info("Evaluating...")
            test_loss, test_accuracy = self.model.evaluate(X_test, y_test, verbose=0)
            logger.info(f"✅ Test accuracy: {test_accuracy:.4f} ({test_accuracy*100:.2f}%)")
            logger.info(f"📊 Test loss: {test_loss:.4f}")
            
            # Save final model
            final_model_path = self.model_output_dir / "gesture_model.h5"
            self.model.save(str(final_model_path))
            logger.info(f"✅ Model saved: {final_model_path}")
            
            logger.info("=" * 60)
            logger.info("✅ Training completed successfully!")
            logger.info("=" * 60)
            
            return {
                'accuracy': float(test_accuracy),
                'loss': float(test_loss),
                'model_path': str(final_model_path)
            }
        
        except Exception as e:
            logger.error(f"Error during training: {e}", exc_info=True)
            return None


def main():
    parser = argparse.ArgumentParser(description="Efficient gesture model training")
    parser.add_argument("--dataset", required=True, help="Path to datasetTTNM folder")
    parser.add_argument("--epochs", type=int, default=10, help="Number of epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size")
    parser.add_argument("--max-images", type=int, default=300, help="Max images per label")
    parser.add_argument("--output-dir", default="models", help="Model output directory")
    
    args = parser.parse_args()
    
    trainer = EfficientGestureTrainer(
        dataset_path=args.dataset,
        model_output_dir=args.output_dir
    )
    
    results = trainer.train_with_limited_data(
        max_images_per_label=args.max_images,
        epochs=args.epochs,
        batch_size=args.batch_size
    )
    
    if results:
        logger.info(f"\nFinal Results:")
        logger.info(f"  Accuracy: {results['accuracy']*100:.2f}%")
        logger.info(f"  Model: {results['model_path']}")


if __name__ == "__main__":
    main()

import numpy as np
import logging
import json
from pathlib import Path
from datetime import datetime
import tensorflow as tf
from .dataset_loader import DatasetLoader
from .trainer import ModelTrainer

logger = logging.getLogger(__name__)


class GestureModelTrainer:
    """Complete training pipeline for gesture recognition model"""
    
    def __init__(self, dataset_path, model_output_dir="models", use_preprocessed=True):
        """
        Initialize trainer
        
        Args:
            dataset_path: Path to datasetTTNM folder
            model_output_dir: Directory to save trained models
            use_preprocessed: Whether to use preprocessed data
        """
        self.dataset_path = Path(dataset_path)
        self.model_output_dir = Path(model_output_dir)
        self.model_output_dir.mkdir(parents=True, exist_ok=True)
        
        self.use_preprocessed = use_preprocessed
        self.dataset_loader = DatasetLoader(dataset_path, use_preprocessed)
        
        self.model = None
        self.history = None
        
        logger.info(f"GestureModelTrainer initialized")
    
    def train(self, epochs=50, batch_size=32, validation_split=0.1, augment=False,
              max_images_per_label=None, learning_rate=0.001, save_best=True):
        """
        Complete training pipeline
        
        Args:
            epochs: Number of training epochs
            batch_size: Batch size
            validation_split: Fraction of data for validation
            augment: Whether to apply data augmentation
            max_images_per_label: Max images per label (None for all)
            learning_rate: Learning rate for optimizer
            save_best: Whether to save best model during training
        
        Returns:
            Dictionary with training results
        """
        logger.info("=" * 60)
        logger.info("Starting gesture model training pipeline")
        logger.info("=" * 60)
        
        try:
            # Load dataset
            logger.info("Loading dataset...")
            X, y = self.dataset_loader.load_dataset(
                image_size=(224, 224),
                max_images_per_label=max_images_per_label,
                augment=augment
            )
            
            if X.shape[0] == 0:
                logger.error("No images loaded. Check dataset path and structure.")
                return None
            
            # Get label distribution
            distribution = self.dataset_loader.get_label_distribution(y)
            logger.info("Label distribution (training set):")
            for label, count in sorted(distribution.items()):
                logger.info(f"  {label}: {count} images")
            
            # Split dataset
            logger.info("Splitting dataset...")
            X_train, X_val, X_test, y_train, y_val, y_test = \
                self.dataset_loader.split_dataset(X, y, test_size=0.1, val_size=validation_split)
            
            # Create model
            logger.info("Creating model...")
            input_shape = (224, 224, 3)
            num_classes = len(self.dataset_loader.LABELS)
            
            self.model = ModelTrainer.create_cnn_model(input_shape, num_classes)
            if self.model is None:
                raise Exception("Failed to create model")
            
            self.model = ModelTrainer.compile_model(self.model, learning_rate=learning_rate)
            if self.model is None:
                raise Exception("Failed to compile model")
            
            # Print model summary
            logger.info("Model architecture:")
            self.model.summary()
            
            # Setup callbacks
            callbacks = self._setup_callbacks(save_best)
            
            # Train model
            logger.info("Training model...")
            logger.info(f"Epochs: {epochs}, Batch size: {batch_size}")
            
            self.history = self.model.fit(
                X_train, y_train,
                batch_size=batch_size,
                epochs=epochs,
                validation_data=(X_val, y_val),
                callbacks=callbacks,
                verbose=1
            )
            
            # Evaluate on test set
            logger.info("Evaluating on test set...")
            test_loss, test_accuracy = self.model.evaluate(X_test, y_test, verbose=1)
            logger.info(f"Test loss: {test_loss:.4f}")
            logger.info(f"Test accuracy: {test_accuracy:.4f}")
            
            # Save final model and metadata
            results = self._save_training_results(
                test_loss, test_accuracy, 
                X_train, X_val, X_test,
                epochs, batch_size, learning_rate
            )
            
            logger.info("=" * 60)
            logger.info("Training completed successfully!")
            logger.info("=" * 60)
            
            return results
        
        except Exception as e:
            logger.error(f"Error during training: {e}", exc_info=True)
            return None
    
    def _setup_callbacks(self, save_best=True):
        """Setup training callbacks"""
        callbacks = []
        
        if save_best:
            best_model_path = self.model_output_dir / "best_model.h5"
            callbacks.append(
                tf.keras.callbacks.ModelCheckpoint(
                    str(best_model_path),
                    monitor='val_accuracy',
                    save_best_only=True,
                    mode='max',
                    verbose=1
                )
            )
        
        # Early stopping
        callbacks.append(
            tf.keras.callbacks.EarlyStopping(
                monitor='val_accuracy',
                patience=5,
                restore_best_weights=True,
                verbose=1
            )
        )
        
        # Learning rate reduction
        callbacks.append(
            tf.keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=3,
                min_lr=1e-7,
                verbose=1
            )
        )
        
        return callbacks
    
    def _save_training_results(self, test_loss, test_accuracy, X_train, X_val, X_test,
                               epochs, batch_size, learning_rate):
        """Save trained model and training metadata"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save model
        model_path = self.model_output_dir / f"gesture_model_{timestamp}.h5"
        self.model.save(str(model_path))
        logger.info(f"Model saved to: {model_path}")
        
        # Save training metadata
        metadata = {
            "timestamp": timestamp,
            "model_path": str(model_path),
            "use_preprocessed_data": self.use_preprocessed,
            "dataset_path": str(self.dataset_path),
            "training_config": {
                "epochs": epochs,
                "batch_size": batch_size,
                "learning_rate": learning_rate,
            },
            "dataset_info": {
                "num_classes": len(self.dataset_loader.LABELS),
                "input_shape": [224, 224, 3],
                "labels": self.dataset_loader.LABELS,
                "split_sizes": {
                    "train": X_train.shape[0],
                    "val": X_val.shape[0],
                    "test": X_test.shape[0]
                }
            },
            "results": {
                "test_loss": float(test_loss),
                "test_accuracy": float(test_accuracy),
                "training_history": {
                    "epochs": len(self.history.history['loss']),
                    "final_train_loss": float(self.history.history['loss'][-1]),
                    "final_train_accuracy": float(self.history.history['accuracy'][-1]),
                    "final_val_loss": float(self.history.history['val_loss'][-1]),
                    "final_val_accuracy": float(self.history.history['val_accuracy'][-1]),
                }
            }
        }
        
        metadata_path = self.model_output_dir / f"metadata_{timestamp}.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        logger.info(f"Metadata saved to: {metadata_path}")
        
        return metadata
    
    def evaluate_model(self, model_path, X_test=None, y_test=None):
        """
        Evaluate a trained model
        
        Args:
            model_path: Path to saved model
            X_test: Test images (if None, will load from dataset)
            y_test: Test labels (if None, will load from dataset)
        
        Returns:
            Evaluation results
        """
        try:
            logger.info(f"Loading model from: {model_path}")
            self.model = tf.keras.models.load_model(model_path)
            
            if X_test is None or y_test is None:
                logger.info("Loading test dataset...")
                X, y = self.dataset_loader.load_dataset()
                _, _, X_test, _, _, y_test = \
                    self.dataset_loader.split_dataset(X, y, test_size=0.2)
            
            logger.info("Evaluating model...")
            loss, accuracy = self.model.evaluate(X_test, y_test)
            
            results = {
                "model_path": model_path,
                "test_loss": float(loss),
                "test_accuracy": float(accuracy)
            }
            
            logger.info(f"Test Loss: {loss:.4f}")
            logger.info(f"Test Accuracy: {accuracy:.4f}")
            
            return results
        
        except Exception as e:
            logger.error(f"Error evaluating model: {e}")
            return None

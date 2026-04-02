"""
Simple gesture model training using project utilities
"""

import logging
import argparse
import sys
from pathlib import Path
from utils.dataset_loader import DatasetLoader
from utils.trainer import ModelTrainer
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Train gesture recognition model")
    parser.add_argument("--dataset", required=True, help="Path to datasetTTNM folder")
    parser.add_argument("--epochs", type=int, default=10, help="Number of epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size")
    parser.add_argument("--max-images", type=int, default=300, help="Max images per label")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--output-dir", default="models", help="Model output directory")
    
    args = parser.parse_args()
    
    try:
        logger.info("=" * 60)
        logger.info("Starting Gesture Model Training")
        logger.info("=" * 60)
        
        # Initialize dataset loader
        logger.info(f"Loading dataset from: {args.dataset}")
        loader = DatasetLoader(args.dataset, use_preprocessed=True)
        
        # Load dataset with memory limit
        logger.info(f"Loading {args.max_images} images per label...")
        X, y = loader.load_dataset(
            image_size=(224, 224),
            max_images_per_label=args.max_images,
            augment=False
        )
        
        if X.shape[0] == 0:
            logger.error("No images loaded!")
            return
        
        logger.info(f"✅ Dataset loaded: {X.shape[0]} images")
        logger.info(f"   Image shape: {X.shape[1:]}")
        logger.info(f"   Classes: {len(loader.LABELS)}")
        
        # Split dataset
        logger.info("Splitting dataset (train/val/test = 70%/15%/15%)...")
        X_train, X_val, X_test, y_train, y_val, y_test = \
            loader.split_dataset(X, y, test_size=0.15, val_size=0.15)
        
        logger.info(f"  Train: {X_train.shape[0]} images")
        logger.info(f"  Val:   {X_val.shape[0]} images")
        logger.info(f"  Test:  {X_test.shape[0]} images")
        
        # Create & compile model
        logger.info("Creating CNN model...")
        model = ModelTrainer.create_cnn_model(
            input_shape=(224, 224, 3),
            num_classes=len(loader.LABELS)
        )
        
        model = ModelTrainer.compile_model(model, learning_rate=args.lr)
        logger.info("✅ Model created and compiled")
        
        # Create output directory
        Path(args.output_dir).mkdir(parents=True, exist_ok=True)
        
        # Train model  
        logger.info(f"Training for {args.epochs} epochs (batch_size={args.batch_size})...")
        import tensorflow as tf
        
        callbacks = [
            tf.keras.callbacks.ModelCheckpoint(
                f"{args.output_dir}/best_model.h5",
                monitor='val_accuracy',
                save_best_only=True,
                verbose=0
            ),
            tf.keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=2,
                verbose=1
            )
        ]
        
        history = model.fit(
            X_train, y_train,
            batch_size=args.batch_size,
            epochs=args.epochs,
            validation_data=(X_val, y_val),
            callbacks=callbacks,
            verbose=1
        )
        
        # Evaluate
        logger.info("\n📊 Evaluating on test set...")
        test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
        logger.info(f"✅ Test Accuracy: {test_acc*100:.2f}%")
        logger.info(f"📉 Test Loss: {test_loss:.4f}")
        
        # Save final model
        final_path = f"{args.output_dir}/gesture_model_final.h5"
        model.save(final_path)
        logger.info(f"✅ Model saved: {final_path}")
        
        logger.info("\n" + "=" * 60)
        logger.info("✅ TRAINING COMPLETED SUCCESSFULLY!")
        logger.info("=" * 60)
        logger.info(f"📁 Best model: {args.output_dir}/best_model.h5")
        logger.info(f"📁 Final model: {final_path}")
        logger.info(f"🎯 Accuracy: {test_acc*100:.2f}%")
        
    except Exception as e:
        logger.error(f"❌ Error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()

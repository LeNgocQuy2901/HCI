"""
Minimal gesture model training - avoiding keras issues
"""

import logging
import argparse
import sys
from pathlib import Path
from utils.dataset_loader import DatasetLoader
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def build_model(input_shape=(224, 224, 3), num_classes=37):
    """Build sequential CNN model without importing keras submodules"""
    try:
        import tensorflow as tf
        
        model = tf.Sequential([
            tf.layers.Conv2D(32, 3, padding='same', activation='relu', input_shape=input_shape),
            tf.layers.BatchNormalization(),
            tf.layers.MaxPooling2D(2),
            tf.layers.Dropout(0.25),
            
            tf.layers.Conv2D(64, 3, padding='same', activation='relu'),
            tf.layers.BatchNormalization(),
            tf.layers.MaxPooling2D(2),
            tf.layers.Dropout(0.25),
            
            tf.layers.Conv2D(128, 3, padding='same', activation='relu'),
            tf.layers.BatchNormalization(),
            tf.layers.MaxPooling2D(2),
            tf.layers.Dropout(0.25),
            
            tf.layers.Flatten(),
            tf.layers.Dense(256, activation='relu'),
            tf.layers.Dropout(0.5),
            tf.layers.Dense(num_classes, activation='softmax')
        ])
        
        return model
    except Exception as e:
        logger.error(f"Error building model: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Train gesture recognition model")
    parser.add_argument("--dataset", required=True, help="Path to datasetTTNM folder")
    parser.add_argument("--epochs", type=int, default=5, help="Number of epochs") 
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--max-images", type=int, default=100, help="Max images per label")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--output-dir", default="models", help="Model output directory")
    
    args = parser.parse_args()
    
    try:
        import tensorflow as tf
        
        logger.info("=" * 70)
        logger.info("🎯 GESTURE RECOGNITION MODEL TRAINING")
        logger.info("=" * 70)
        
        # 1. Load dataset
        logger.info(f"\n📂 Loading dataset from: {args.dataset}")
        loader = DatasetLoader(args.dataset, use_preprocessed=True)
        
        logger.info(f"📥 Loading {args.max_images} images per label...")
        X, y = loader.load_dataset(
            image_size=(224, 224),
            max_images_per_label=args.max_images,
            augment=False
        )
        
        if X.shape[0] == 0:
            logger.error("❌ No images loaded!")
            return
        
        logger.info(f"✅ Dataset loaded: {X.shape[0]} total images")
        logger.info(f"   Shape: {X.shape}")
        logger.info(f"   Classes: {len(loader.LABELS)}")
        
        # 2. Split dataset
        logger.info("\n🔀 Splitting dataset...")
        X_train, X_val, X_test, y_train, y_val, y_test = \
            loader.split_dataset(X, y, test_size=0.15, val_size=0.15)
        
        logger.info(f"   Train: {X_train.shape[0]} samples")
        logger.info(f"   Val:   {X_val.shape[0]} samples")
        logger.info(f"   Test:  {X_test.shape[0]} samples")
        
        # 3. Create model
        logger.info("\n🏗️ Building model...")
        model = tf.Sequential([
            tf.keras.layers.Conv2D(32, 3, padding='same', activation='relu', input_shape=(224, 224, 3)),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.MaxPooling2D(2),
            tf.keras.layers.Dropout(0.25),
            
            tf.keras.layers.Conv2D(64, 3, padding='same', activation='relu'),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.MaxPooling2D(2),
            tf.keras.layers.Dropout(0.25),
            
            tf.keras.layers.Conv2D(128, 3, padding='same', activation='relu'),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.MaxPooling2D(2),
            tf.keras.layers.Dropout(0.25),
            
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(256, activation='relu'),
            tf.keras.layers.Dropout(0.5),
            tf.keras.layers.Dense(len(loader.LABELS), activation='softmax')
        ])
        
        # 4. Compile model
        logger.info("⚙️ Compiling model...")
        optimizer = tf.keras.optimizers.Adam(learning_rate=args.lr)
        model.compile(
            optimizer=optimizer,
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        logger.info("✅ Model compiled")
        
        # 5. Train model
        logger.info(f"\n🚀 Training for {args.epochs} epochs...")
        logger.info(f"   Batch size: {args.batch_size}")
        logger.info(f"   Learning rate: {args.lr}")
        
        history = model.fit(
            X_train, y_train,
            batch_size=args.batch_size,
            epochs=args.epochs,
            validation_data=(X_val, y_val),
            verbose=1
        )
        
        # 6. Evaluate
        logger.info("\n📊 Evaluating on test set...")
        test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
        logger.info(f"✅ Test Accuracy: {test_acc*100:.2f}%")
        logger.info(f"📉 Test Loss: {test_loss:.4f}")
        
        # 7. Save model
        Path(args.output_dir).mkdir(parents=True, exist_ok=True)
        model_path = f"{args.output_dir}/gesture_model.h5"
        model.save(model_path)
        logger.info(f"\n💾 Model saved: {model_path}")
        
        logger.info("\n" + "=" * 70)
        logger.info("✅ TRAINING COMPLETED SUCCESSFULLY!")
        logger.info("=" * 70)
        logger.info(f"🎯 Final Accuracy: {test_acc*100:.2f}%")
        logger.info(f"📁 Model path: {Path(model_path).absolute()}")
        
    except Exception as e:
        logger.error(f"\n❌ Error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()

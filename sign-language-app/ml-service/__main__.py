import logging
import argparse
import sys
from pathlib import Path
from gesture_recognizer import GestureRecognizer
from utils.model_trainer import GestureModelTrainer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def inference_mode():
    """Run gesture recognition in inference mode"""
    logger.info("Initializing Gesture Recognizer for inference...")
    
    recognizer = GestureRecognizer(model_path="models/best_model.h5")
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


def training_mode(dataset_path, epochs=50, batch_size=32, lr=0.001, augment=False, max_images=None):
    """Train the model on gesture dataset"""
    logger.info("Starting training mode...")
    
    dataset_path_obj = Path(dataset_path)
    if not dataset_path_obj.exists():
        logger.error(f"Dataset path not found: {dataset_path}")
        sys.exit(1)
    
    trainer = GestureModelTrainer(
        dataset_path=dataset_path,
        model_output_dir="models",
        use_preprocessed=True
    )
    
    results = trainer.train(
        epochs=epochs,
        batch_size=batch_size,
        validation_split=0.1,
        augment=augment,
        max_images_per_label=max_images,
        learning_rate=lr,
        save_best=True
    )
    
    if results:
        logger.info("Training completed successfully!")
        logger.info(f"Test Accuracy: {results['results']['test_accuracy']:.4f}")
    else:
        logger.error("Training failed!")
        sys.exit(1)


def evaluate_mode(dataset_path, model_path):
    """Evaluate a trained model"""
    logger.info("Starting evaluation mode...")
    
    trainer = GestureModelTrainer(dataset_path=dataset_path)
    results = trainer.evaluate_model(model_path)
    
    if results:
        logger.info(f"Model evaluation completed!")
        logger.info(f"Test Accuracy: {results['test_accuracy']:.4f}")
    else:
        logger.error("Evaluation failed!")
        sys.exit(1)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Gesture Recognition ML Service",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run inference (default)
  python -m __main__
  
  # Train model on dataset
  python -m __main__ --train --dataset /path/to/datasetTTNM
  
  # Train with custom parameters
  python -m __main__ --train --dataset /path/to/datasetTTNM --epochs 100 --batch-size 16
  
  # Evaluate model
  python -m __main__ --evaluate --dataset /path/to/datasetTTNM --model models/best_model.h5
        """
    )
    
    parser.add_argument(
        "--train",
        action="store_true",
        help="Train mode: train model on gesture dataset"
    )
    parser.add_argument(
        "--evaluate",
        action="store_true",
        help="Evaluation mode: evaluate trained model"
    )
    parser.add_argument(
        "--dataset",
        type=str,
        help="Path to datasetTTNM folder"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="models/best_model.h5",
        help="Path to trained model (for inference or evaluation)"
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=50,
        help="Number of training epochs (default: 50)"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Batch size for training (default: 32)"
    )
    parser.add_argument(
        "--lr",
        type=float,
        default=0.001,
        help="Learning rate (default: 0.001)"
    )
    parser.add_argument(
        "--augment",
        action="store_true",
        help="Enable data augmentation"
    )
    parser.add_argument(
        "--max-images",
        type=int,
        help="Maximum images per label (useful for testing)"
    )
    
    args = parser.parse_args()
    
    # Determine mode
    if args.train:
        if not args.dataset:
            parser.error("--dataset is required for training mode")
        training_mode(
            dataset_path=args.dataset,
            epochs=args.epochs,
            batch_size=args.batch_size,
            lr=args.lr,
            augment=args.augment,
            max_images=args.max_images
        )
    elif args.evaluate:
        if not args.dataset:
            parser.error("--dataset is required for evaluation mode")
        evaluate_mode(
            dataset_path=args.dataset,
            model_path=args.model
        )
    else:
        # Default: inference mode
        inference_mode()


if __name__ == "__main__":
    main()

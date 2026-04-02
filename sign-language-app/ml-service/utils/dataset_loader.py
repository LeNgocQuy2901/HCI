import numpy as np
import logging
from pathlib import Path
from sklearn.model_selection import train_test_split
from .preprocessor import DataPreprocessor

logger = logging.getLogger(__name__)


class DatasetLoader:
    """Load and prepare gesture dataset for training"""
    
    # Define all gesture labels (0-9, A-Z, _)
    LABELS = [str(i) for i in range(10)] + [chr(i) for i in range(65, 91)] + ['_']
    LABEL_TO_INDEX = {label: idx for idx, label in enumerate(LABELS)}
    
    def __init__(self, dataset_path, use_preprocessed=True):
        """
        Initialize dataset loader
        
        Args:
            dataset_path: Path to datasetTTNM folder
            use_preprocessed: Whether to use pre-processed data
        """
        self.dataset_path = Path(dataset_path)
        self.use_preprocessed = use_preprocessed
        
        # Determine which dataset folder to use
        if use_preprocessed:
            self.data_folder = self.dataset_path / "Gesture Image Pre-Processed Data"
        else:
            self.data_folder = self.dataset_path / "Gesture Image Data"
        
        if not self.data_folder.exists():
            raise ValueError(f"Dataset folder not found: {self.data_folder}")
        
        logger.info(f"Using dataset from: {self.data_folder}")
    
    def load_images_by_label(self, label, max_images=None):
        """
        Load all images for a specific gesture label
        
        Args:
            label: Gesture label (0-9, A-Z, _)
            max_images: Maximum number of images to load (None for all)
        
        Returns:
            List of image arrays
        """
        label_folder = self.data_folder / str(label)
        
        if not label_folder.exists():
            logger.warning(f"Label folder not found: {label_folder}")
            return []
        
        images = []
        image_files = sorted(label_folder.glob("*.jpg")) + sorted(label_folder.glob("*.png"))
        
        if max_images:
            image_files = image_files[:max_images]
        
        for image_path in image_files:
            image = DataPreprocessor.load_image(image_path)
            if image is not None:
                image = DataPreprocessor.resize_image(image, size=(224, 224))
                image = DataPreprocessor.normalize_image(image)
                images.append(image)
        
        logger.info(f"Loaded {len(images)} images for label '{label}'")
        return images
    
    def load_dataset(self, image_size=(224, 224), max_images_per_label=None, augment=False):
        """
        Load full dataset for training
        
        Args:
            image_size: Target image size
            max_images_per_label: Maximum images per label (None for all)
            augment: Whether to apply data augmentation
        
        Returns:
            Tuple of (X, y) where:
                X: Array of images (N, H, W, 3)
                y: Array of one-hot encoded labels (N, num_classes)
        """
        X = []
        y = []
        
        num_labels = len(self.LABELS)
        total_images = 0
        
        for label_idx, label in enumerate(self.LABELS):
            label_folder = self.data_folder / str(label)
            
            if not label_folder.exists():
                logger.warning(f"Label folder not found: {label}")
                continue
            
            image_files = sorted(label_folder.glob("*.jpg")) + sorted(label_folder.glob("*.png"))
            
            if max_images_per_label:
                image_files = image_files[:max_images_per_label]
            
            for image_path in image_files:
                try:
                    image = DataPreprocessor.load_image(image_path)
                    if image is not None:
                        image = DataPreprocessor.resize_image(image, size=image_size)
                        image = DataPreprocessor.normalize_image(image)
                        
                        X.append(image)
                        # One-hot encode the label
                        one_hot = np.zeros(num_labels)
                        one_hot[label_idx] = 1
                        y.append(one_hot)
                        
                        # Apply augmentation if specified
                        if augment:
                            augmented = DataPreprocessor.augment_image(image)
                            X.append(augmented)
                            y.append(one_hot)
                        
                        total_images += 1
                
                except Exception as e:
                    logger.warning(f"Error loading image {image_path}: {e}")
                    continue
            
            logger.info(f"Processed label '{label}': {len(image_files)} images")
        
        X = np.array(X)
        y = np.array(y)
        
        logger.info(f"Dataset loaded: {X.shape[0]} total images")
        logger.info(f"Image shape: {X.shape[1:]}")
        logger.info(f"Number of classes: {num_labels}")
        
        return X, y
    
    def split_dataset(self, X, y, test_size=0.2, val_size=0.1, random_state=42):
        """
        Split dataset into train, validation, and test sets
        
        Args:
            X: Input images
            y: Labels (one-hot encoded)
            test_size: Fraction of data for testing
            val_size: Fraction of data for validation
            random_state: Random seed
        
        Returns:
            Tuple of (X_train, X_val, X_test, y_train, y_val, y_test)
        """
        # First split: train+val vs test
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y,
            test_size=test_size,
            random_state=random_state,
            stratify=np.argmax(y, axis=1)
        )
        
        # Second split: train vs val
        val_size_adjusted = val_size / (1 - test_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp,
            test_size=val_size_adjusted,
            random_state=random_state,
            stratify=np.argmax(y_temp, axis=1)
        )
        
        logger.info(f"Dataset split:")
        logger.info(f"  Training: {X_train.shape[0]} images")
        logger.info(f"  Validation: {X_val.shape[0]} images")
        logger.info(f"  Test: {X_test.shape[0]} images")
        
        return X_train, X_val, X_test, y_train, y_val, y_test
    
    def get_label_distribution(self, y):
        """
        Get distribution of labels in dataset
        
        Args:
            y: One-hot encoded labels
        
        Returns:
            Dictionary with label counts
        """
        label_indices = np.argmax(y, axis=1)
        unique, counts = np.unique(label_indices, return_counts=True)
        
        distribution = {self.LABELS[idx]: count for idx, count in zip(unique, counts)}
        return distribution
    
    @staticmethod
    def create_data_generator(X_train, y_train, batch_size=32, shuffle=True):
        """
        Create data generator for training
        
        Args:
            X_train: Training images
            y_train: Training labels
            batch_size: Batch size
            shuffle: Whether to shuffle data
        
        Yields:
            Batches of (X, y)
        """
        num_samples = X_train.shape[0]
        indices = np.arange(num_samples)
        
        if shuffle:
            np.random.shuffle(indices)
        
        for i in range(0, num_samples, batch_size):
            batch_indices = indices[i:i + batch_size]
            yield X_train[batch_indices], y_train[batch_indices]

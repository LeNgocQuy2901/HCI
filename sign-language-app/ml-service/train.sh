#!/bin/bash
# Quick training script for gesture recognition model
# Usage: ./train.sh [epochs] [batch_size]

cd "$(dirname "$0")"

EPOCHS=${1:-50}
BATCH_SIZE=${2:-32}
DATASET="../../datasetTTNM"

echo "=========================================="
echo "Gesture Model Training Script"
echo "=========================================="
echo "Dataset: $DATASET"
echo "Epochs: $EPOCHS"
echo "Batch Size: $BATCH_SIZE"
echo ""

# Check if dataset exists
if [ ! -d "$DATASET" ]; then
    echo "ERROR: Dataset not found at $DATASET"
    echo "Please provide correct path to datasetTTNM folder"
    exit 1
fi

# Run training
python -m __main__ --train \
    --dataset "$DATASET" \
    --epochs $EPOCHS \
    --batch-size $BATCH_SIZE \
    --augment

echo ""
echo "Training completed!"
echo "Check models/ folder for trained model files"

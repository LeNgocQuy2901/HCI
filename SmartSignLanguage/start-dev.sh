#!/bin/bash

echo "============================================================"
echo "  Smart Sign Language - Development Environment Setup"
echo "============================================================"
echo

echo "Kích hoạt Virtual Environment..."
source venv/bin/activate

if [ $? -ne 0 ]; then
    echo "ERROR: Không thể kích hoạt venv!"
    exit 1
fi

echo "✓ Virtual Environment activated"
echo
echo "Cài đặt npm dependencies..."
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo "ERROR: npm install thất bại!"
    exit 1
fi

echo
echo "✓ Dependencies installed"
echo "✓ Environment ready!"
echo
echo "Khởi động dev server..."
echo "➜ Local:   http://localhost:8080/"
echo "➜ Press Ctrl+C to stop"
echo

npm run dev

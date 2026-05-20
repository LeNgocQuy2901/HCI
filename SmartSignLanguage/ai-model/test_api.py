"""
Test YOLO API endpoints
Run this to see all API responses
"""

import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:8000"

def pretty_print(title, response):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"🔹 {title}")
    print(f"{'='*60}")
    print(f"Status: {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)

def test_health():
    """Test health check"""
    response = requests.get(f"{BASE_URL}/health")
    pretty_print("1. Health Check (GET /health)", response)

def test_info():
    """Test server info"""
    response = requests.get(f"{BASE_URL}/info")
    pretty_print("2. Server Info (GET /info)", response)

def test_gestures():
    """Test gestures list"""
    response = requests.get(f"{BASE_URL}/api/gestures")
    pretty_print("3. List Gestures (GET /api/gestures)", response)

def test_detect_only():
    """Test detect only endpoint"""
    image_path = Path("test_image.jpg")
    
    if not image_path.exists():
        print("\n❌ Error: test_image.jpg not found!")
        print("   Run: python create_test_image.py")
        return
    
    with open(image_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{BASE_URL}/api/detect-only", files=files)
    
    pretty_print("4. Detect Only (POST /api/detect-only)", response)

def test_classify_only():
    """Test classify only endpoint"""
    image_path = Path("test_image.jpg")
    
    if not image_path.exists():
        print("\n❌ Error: test_image.jpg not found!")
        return
    
    with open(image_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{BASE_URL}/api/classify-only", files=files)
    
    pretty_print("5. Classify Only (POST /api/classify-only)", response)

def test_detect_and_classify():
    """Test detect and classify endpoint"""
    image_path = Path("test_image.jpg")
    
    if not image_path.exists():
        print("\n❌ Error: test_image.jpg not found!")
        return
    
    with open(image_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{BASE_URL}/api/detect-and-classify", files=files)
    
    pretty_print("6. Detect & Classify (POST /api/detect-and-classify)", response)

if __name__ == "__main__":
    print("\n" + "🚀 "*30)
    print("YOLO Sign Language API Test Suite")
    print("🚀 "*30)
    
    try:
        print("\n✓ Testing GET endpoints...")
        test_health()
        test_info()
        test_gestures()
        
        print("\n✓ Testing POST endpoints...")
        test_detect_only()
        test_classify_only()
        test_detect_and_classify()
        
        print("\n" + "="*60)
        print("✅ All tests completed!")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to server!")
        print("   Make sure YOLO server is running:")
        print("   python inference/yolo_inference.py")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")

"""
Create a test image for YOLO API testing
"""

import cv2
import numpy as np
from PIL import Image, ImageDraw

# Create a simple test image with some shapes
img = Image.new('RGB', (640, 480), color='white')
draw = ImageDraw.Draw(img)

# Draw some rectangles to simulate hands/objects
draw.rectangle([100, 100, 200, 250], outline='black', width=3)
draw.text((110, 110), "Hand 1", fill='black')

draw.rectangle([350, 150, 450, 300], outline='blue', width=3)
draw.text((360, 160), "Hand 2", fill='blue')

draw.ellipse([50, 350, 150, 450], outline='red', width=3)
draw.text((60, 380), "Circle", fill='red')

# Add some text
draw.text((250, 50), "YOLO Test Image", fill='black')
draw.text((250, 400), "Test generated on: 2026-05-08", fill='gray')

# Save image
img.save('test_image.jpg')
print("✓ Created test_image.jpg (640x480)")

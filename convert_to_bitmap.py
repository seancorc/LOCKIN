import cv2
import numpy as np
import os

# Create assets directory if it doesn't exist
os.makedirs('assets', exist_ok=True)

# Path to existing image
input_image_path = 'image.png'

# Read the existing image
img = cv2.imread(input_image_path)
if img is None:
    print(f"Error: Could not read image file: {input_image_path}")
    exit(1)

# Convert to grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Resize to required dimensions (576x136)
resized = cv2.resize(gray, (576, 136))

# Convert to binary image (monochrome bitmap)
_, binary = cv2.threshold(resized, 127, 255, cv2.THRESH_BINARY)

# Save as BMP format
output_path = 'assets/test.bmp'
cv2.imwrite(output_path, binary)

print(f"Converted image saved to {output_path}") 
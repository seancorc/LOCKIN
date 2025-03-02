import cv2
import numpy as np
import os

# Create assets directory if it doesn't exist
os.makedirs('assets', exist_ok=True)

# Create an empty black canvas with the same dimensions as our main bitmap
width, height = 576, 136
empty_img = np.zeros((height, width), dtype=np.uint8)

# Save as bitmap
output_path = 'assets/empty.bmp'
cv2.imwrite(output_path, empty_img)

print(f"Empty bitmap created at {output_path}") 
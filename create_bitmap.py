import cv2
import numpy as np
import os

# Create directory for assets if it doesn't exist
os.makedirs('assets', exist_ok=True)

# Create a black canvas with the requested dimensions: 576x136
width, height = 576, 136
img = np.zeros((height, width), dtype=np.uint8)

# Draw a simple pattern or text
# Draw a circle
cv2.circle(img, (width//2, height//2), 40, 255, 2)

# Draw a smiley face
# Eyes
eye_size = 8
left_eye_center = (width//2 - 25, height//2 - 10)
right_eye_center = (width//2 + 25, height//2 - 10)
cv2.circle(img, left_eye_center, eye_size, 255, -1)
cv2.circle(img, right_eye_center, eye_size, 255, -1)

# Smile
smile_start = (width//2 - 35, height//2 + 10)
smile_end = (width//2 + 35, height//2 + 10)
smile_height = 15
smile_curve = np.array([
    [smile_start[0], smile_start[1]],
    [width//2, smile_start[1] + smile_height],
    [smile_end[0], smile_end[1]]
], dtype=np.int32)
cv2.polylines(img, [smile_curve], False, 255, 2)

# Add some text
font = cv2.FONT_HERSHEY_SIMPLEX
cv2.putText(img, 'Hello from AugmentOS!', (width//2 - 150, 30), font, 1, 255, 2, cv2.LINE_AA)

# Save as monochrome bitmap
cv2.imwrite('assets/test.bmp', img)

print("Bitmap created at assets/test.bmp") 
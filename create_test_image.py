#!/usr/bin/env python3
"""
Generate abstract test images for NOISECORE cards.
No anime — produces silhouette/abstract/gradient images.
"""

import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def create_silhouette(width=600, height=800):
    """Create an abstract human silhouette on a dark red background."""
    img = Image.new("RGB", (width, height), (15, 5, 5))
    draw = ImageDraw.Draw(img)

    cx, cy = width // 2, height // 2

    # Abstract head
    head_r = width // 8
    draw.ellipse(
        (cx - head_r, cy - height // 3 - head_r,
         cx + head_r, cy - height // 3 + head_r),
        fill=(60, 15, 10),
    )

    # Abstract body / torso
    body_points = [
        (cx - width // 6, cy - height // 3 + head_r),
        (cx + width // 6, cy - height // 3 + head_r),
        (cx + width // 5, cy + height // 4),
        (cx - width // 5, cy + height // 4),
    ]
    draw.polygon(body_points, fill=(50, 12, 8))

    # Legs
    draw.polygon([
        (cx - width // 5, cy + height // 4),
        (cx - width // 10, cy + height // 4),
        (cx - width // 8, height - 20),
        (cx - width // 4, height - 20),
    ], fill=(40, 10, 7))
    draw.polygon([
        (cx + width // 10, cy + height // 4),
        (cx + width // 5, cy + height // 4),
        (cx + width // 4, height - 20),
        (cx + width // 8, height - 20),
    ], fill=(40, 10, 7))

    # Soft blur for dreaminess
    img = img.filter(ImageFilter.GaussianBlur(radius=4))

    # Red gradient wash
    arr = np.array(img, dtype=np.float32)
    gradient = np.linspace(0.3, 1.0, height).reshape(-1, 1, 1)
    arr[:, :, 0] = np.clip(arr[:, :, 0] * gradient[:, :, 0] + 30 * gradient[:, :, 0], 0, 255)
    img = Image.fromarray(arr.astype(np.uint8))

    return img


def create_abstract_gradient(width=600, height=800):
    """Create a moody red/black gradient with noise."""
    arr = np.zeros((height, width, 3), dtype=np.float32)

    # Radial gradient from center
    cy, cx = height // 2, width // 2
    Y, X = np.ogrid[:height, :width]
    dist = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2)
    max_dist = np.sqrt(cx ** 2 + cy ** 2)
    norm = 1.0 - (dist / max_dist)

    arr[:, :, 0] = norm * 120  # red channel
    arr[:, :, 1] = norm * 20   # slight warmth
    arr[:, :, 2] = norm * 10

    # Noise
    noise = np.random.normal(0, 8, arr.shape)
    arr = np.clip(arr + noise, 0, 255)

    return Image.fromarray(arr.astype(np.uint8))


def create_test_images(output_dir="test_images"):
    """Generate a set of test images."""
    os.makedirs(output_dir, exist_ok=True)

    silhouette = create_silhouette()
    silhouette.save(os.path.join(output_dir, "silhouette.png"))
    print(f"  -> {output_dir}/silhouette.png")

    gradient = create_abstract_gradient()
    gradient.save(os.path.join(output_dir, "gradient.png"))
    print(f"  -> {output_dir}/gradient.png")

    return output_dir


if __name__ == "__main__":
    print("Creating NOISECORE test images...")
    create_test_images()
    print("Done.")

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


def create_liminal(width=600, height=800):
    """Create a liminal corridor image — empty hallway, perspective tiles, glow at the end."""
    arr = np.zeros((height, width, 3), dtype=np.float32)

    # Vanishing point
    vp_x, vp_y = width // 2, int(height * 0.42)

    # --- Floor tiles in perspective ---
    floor_top = vp_y
    floor_bot = height
    num_h_lines = 14
    for i in range(num_h_lines + 1):
        t = (i / num_h_lines) ** 1.8
        y = int(floor_top + t * (floor_bot - floor_top))
        half_w = int(10 + t * (width / 2 - 10))
        x0 = max(0, width // 2 - half_w)
        x1 = min(width - 1, width // 2 + half_w)
        brightness = 18 + int(t * 28)
        for dy in range(2):
            if y + dy < height:
                arr[y + dy, x0:x1, 0] = brightness
                arr[y + dy, x0:x1, 1] = int(brightness * 0.55)
                arr[y + dy, x0:x1, 2] = int(brightness * 0.4)

    num_v_lines = 10
    for i in range(-num_v_lines // 2, num_v_lines // 2 + 1):
        floor_x = width // 2 + i * (width // num_v_lines)
        for frac in np.linspace(0.0, 1.0, 300):
            t = frac ** 1.5
            y = int(floor_top + t * (floor_bot - floor_top))
            x = int(vp_x + (floor_x - vp_x) * t)
            if 0 <= x < width and 0 <= y < height:
                brightness = 16 + int(t * 22)
                arr[y, x, 0] = max(arr[y, x, 0], brightness)
                arr[y, x, 1] = max(arr[y, x, 1], int(brightness * 0.5))
                arr[y, x, 2] = max(arr[y, x, 2], int(brightness * 0.35))

    # --- Ceiling mirror (flip floor) ---
    ceil_bot = vp_y
    ceil_top = 0
    for i in range(num_h_lines + 1):
        t = (i / num_h_lines) ** 1.8
        y = int(ceil_bot - t * (ceil_bot - ceil_top))
        half_w = int(10 + t * (width / 2 - 10))
        x0 = max(0, width // 2 - half_w)
        x1 = min(width - 1, width // 2 + half_w)
        brightness = 12 + int(t * 18)
        for dy in range(2):
            if y + dy < height:
                arr[y + dy, x0:x1, 0] = brightness
                arr[y + dy, x0:x1, 1] = int(brightness * 0.45)
                arr[y + dy, x0:x1, 2] = int(brightness * 0.3)

    # --- Side walls ---
    for side in [-1, 1]:
        for frac in np.linspace(0.0, 1.0, 400):
            t = frac ** 1.4
            y = int(floor_top + side * (t - 0.5) * height * 0.5)
            x = int(vp_x + side * t * (width // 2 - 5))
            if 0 <= x < width and 0 <= y < height:
                brightness = 14 + int(t * 20)
                arr[y, x, 0] = max(arr[y, x, 0], brightness)

    # --- Glow at vanishing point (the "door" at the end) ---
    Y, X = np.ogrid[:height, :width]
    dist_vp = np.sqrt((X - vp_x) ** 2 + (Y - vp_y) ** 2).astype(np.float32)
    glow_r = width * 0.18
    glow_mask = np.clip(1.0 - dist_vp / glow_r, 0, 1) ** 2.2
    arr[:, :, 0] += glow_mask * 110
    arr[:, :, 1] += glow_mask * 28
    arr[:, :, 2] += glow_mask * 12

    # Tight bright doorway rectangle
    dw, dh = int(width * 0.07), int(height * 0.14)
    dy0, dy1 = vp_y - dh // 2, vp_y + dh // 2
    dx0, dx1 = vp_x - dw // 2, vp_x + dw // 2
    arr[dy0:dy1, dx0:dx1, 0] = np.clip(arr[dy0:dy1, dx0:dx1, 0] + 160, 0, 255)
    arr[dy0:dy1, dx0:dx1, 1] = np.clip(arr[dy0:dy1, dx0:dx1, 1] + 50, 0, 255)
    arr[dy0:dy1, dx0:dx1, 2] = np.clip(arr[dy0:dy1, dx0:dx1, 2] + 20, 0, 255)

    # --- Fluorescent ceiling strip lights ---
    strip_y_positions = [int(vp_y * 0.18), int(vp_y * 0.48), int(vp_y * 0.78)]
    for sy in strip_y_positions:
        t = 1.0 - (sy / vp_y)
        half_w = max(4, int((1.0 - t) * width * 0.38))
        strip_x0 = width // 2 - half_w
        strip_x1 = width // 2 + half_w
        brightness = int(55 + t * 30)
        for row in range(sy - 1, sy + 2):
            if 0 <= row < height:
                arr[row, strip_x0:strip_x1, 0] = np.clip(
                    arr[row, strip_x0:strip_x1, 0] + brightness, 0, 255
                )
                arr[row, strip_x0:strip_x1, 1] = np.clip(
                    arr[row, strip_x0:strip_x1, 1] + int(brightness * 0.4), 0, 255
                )
                arr[row, strip_x0:strip_x1, 2] = np.clip(
                    arr[row, strip_x0:strip_x1, 2] + int(brightness * 0.25), 0, 255
                )

    # --- Film grain ---
    noise = np.random.normal(0, 6, arr.shape)
    arr = np.clip(arr + noise, 0, 255)

    img = Image.fromarray(arr.astype(np.uint8))
    img = img.filter(ImageFilter.GaussianBlur(radius=0.7))
    return img


def create_test_images(output_dir="test_images"):
    """Generate a set of test images."""
    os.makedirs(output_dir, exist_ok=True)

    silhouette = create_silhouette()
    silhouette.save(os.path.join(output_dir, "silhouette.png"))
    print(f"  -> {output_dir}/silhouette.png")

    gradient = create_abstract_gradient()
    gradient.save(os.path.join(output_dir, "gradient.png"))
    print(f"  -> {output_dir}/gradient.png")

    liminal = create_liminal()
    liminal.save(os.path.join(output_dir, "liminal.png"))
    print(f"  -> {output_dir}/liminal.png")

    return output_dir


if __name__ == "__main__":
    print("Creating NOISECORE test images...")
    create_test_images()
    print("Done.")

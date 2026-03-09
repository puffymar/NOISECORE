"""
NOISECORE filter — analog CRT fever-dream aesthetic.

Applies grain, scanlines, red/orange tint, chromatic aberration,
bloom/glow, and vignette to images.
"""

import random
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
import numpy as np


def add_grain(img, intensity=0.12, seed=None):
    """Overlay film grain noise."""
    if seed is not None:
        np.random.seed(seed)
    arr = np.array(img, dtype=np.float32)
    noise = np.random.normal(0, intensity * 255, arr.shape).astype(np.float32)
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def add_scanlines(img, opacity=0.25, spacing=2):
    """Horizontal CRT scanlines."""
    arr = np.array(img, dtype=np.float32)
    for y in range(0, arr.shape[0], spacing):
        arr[y, :, :] *= (1.0 - opacity)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def chromatic_aberration(img, offset=2):
    """Shift RGB channels slightly for that analog bleed."""
    r, g, b = img.split()[:3]
    # Shift red left, blue right
    r = r.transform(r.size, Image.AFFINE, (1, 0, offset, 0, 1, 0))
    b = b.transform(b.size, Image.AFFINE, (1, 0, -offset, 0, 1, 0))
    if img.mode == "RGBA":
        a = img.split()[3]
        return Image.merge("RGBA", (r, g, b, a))
    return Image.merge("RGB", (r, g, b))


def blood_red_tint(img, strength=0.6):
    """Push the image toward deep blood red / dark orange."""
    arr = np.array(img, dtype=np.float32)
    # Tint: boost red, slight orange in green, crush blue
    if arr.shape[2] >= 3:
        arr[:, :, 0] = arr[:, :, 0] * (1.0 + strength * 0.5)  # red boost
        arr[:, :, 1] = arr[:, :, 1] * (1.0 - strength * 0.4)  # green reduce
        arr[:, :, 2] = arr[:, :, 2] * (1.0 - strength * 0.7)  # blue crush
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def add_vignette(img, strength=0.7):
    """Dark vignette around edges — CRT tube falloff."""
    w, h = img.size
    arr = np.array(img, dtype=np.float32)
    cx, cy = w / 2.0, h / 2.0
    max_dist = np.sqrt(cx ** 2 + cy ** 2)

    Y, X = np.ogrid[:h, :w]
    dist = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2)
    # Normalize and apply falloff curve
    vignette = 1.0 - strength * (dist / max_dist) ** 1.5
    vignette = np.clip(vignette, 0, 1)

    channels = arr.shape[2] if len(arr.shape) == 3 else 1
    for c in range(min(channels, 3)):  # don't touch alpha
        arr[:, :, c] *= vignette

    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def add_bloom(img, radius=8, intensity=0.3):
    """Soft glow / bloom on bright areas."""
    blurred = img.filter(ImageFilter.GaussianBlur(radius=radius))
    return Image.blend(img, blurred, intensity)


def add_horizontal_glitch(img, num_slices=5, max_offset=8, seed=None):
    """Subtle horizontal slice displacement — glitchy CRT feel."""
    rng = random.Random(seed)
    arr = np.array(img)
    h = arr.shape[0]
    for _ in range(num_slices):
        y = rng.randint(0, h - 4)
        slice_h = rng.randint(1, 3)
        offset = rng.randint(-max_offset, max_offset)
        arr[y:y + slice_h] = np.roll(arr[y:y + slice_h], offset, axis=1)
    return Image.fromarray(arr)


def apply_noisecore_filter(img, preset="default"):
    """
    Full NOISECORE filter pipeline.

    Presets:
        default  — standard fever-dream look
        heavy    — more grain, stronger tint
        subtle   — lighter touch
    """
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")

    presets = {
        "default": dict(
            tint=0.55, grain=0.10, scanline_opacity=0.20,
            chroma_offset=2, vignette=0.6, bloom_radius=6,
            bloom_intensity=0.25, glitch_slices=4, glitch_offset=6,
        ),
        "heavy": dict(
            tint=0.75, grain=0.18, scanline_opacity=0.30,
            chroma_offset=3, vignette=0.8, bloom_radius=10,
            bloom_intensity=0.35, glitch_slices=8, glitch_offset=12,
        ),
        "subtle": dict(
            tint=0.35, grain=0.06, scanline_opacity=0.12,
            chroma_offset=1, vignette=0.4, bloom_radius=4,
            bloom_intensity=0.15, glitch_slices=2, glitch_offset=4,
        ),
    }
    p = presets.get(preset, presets["default"])

    img = blood_red_tint(img, strength=p["tint"])
    img = chromatic_aberration(img, offset=p["chroma_offset"])
    img = add_bloom(img, radius=p["bloom_radius"], intensity=p["bloom_intensity"])
    img = add_scanlines(img, opacity=p["scanline_opacity"])
    img = add_grain(img, intensity=p["grain"])
    img = add_horizontal_glitch(img, num_slices=p["glitch_slices"],
                                max_offset=p["glitch_offset"])
    img = add_vignette(img, strength=p["vignette"])

    return img


def apply_to_photo_region(img, preset="default"):
    """
    Apply NOISECORE photo grade: strong red-orange color shift that preserves
    the subject's face and features — like a red gel, not a darkness mask.
    """
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")

    arr = np.array(img, dtype=np.float32)

    # Color grade: amplify red channel, warm the image, crush blue completely.
    # This keeps luminosity/contrast while shifting everything into red-orange.
    arr[:, :, 0] = np.clip(arr[:, :, 0] * 1.25 + 25, 0, 255)   # red: boost + lift
    arr[:, :, 1] = np.clip(arr[:, :, 1] * 0.50, 0, 255)          # green: halve
    arr[:, :, 2] = np.clip(arr[:, :, 2] * 0.10, 0, 255)          # blue: nearly zero

    img = Image.fromarray(arr.astype(np.uint8))

    # Subtle bloom to give the warm-skin-through-red-light feeling
    img = add_bloom(img, radius=3, intensity=0.18)

    # Very light grain and scanlines — don't destroy detail
    img = add_scanlines(img, opacity=0.08, spacing=3)
    img = add_grain(img, intensity=0.04)

    return img

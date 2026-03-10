"""
NOISECORE caption card layout engine.

Generates social-media cards with the analog CRT fever-dream aesthetic:
- Deep dark warm background with subtle CRT texture
- Glowing red/orange card border
- Bold auto-sized title fills card width
- Red-tinted photo inset with rounded corners and strong orange glow border
- Body text in blood orange-red
- Footer: NOISECORE // DREAMLOG XX
- Scanlines and grain baked over the whole card
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
import noisecore_filter as nf

# ---------------------------------------------------------------------------
# Font helpers
# ---------------------------------------------------------------------------

_FONT_BOLD_PATHS = [
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial Bold.ttf",
    "C:/Windows/Fonts/impact.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]

_FONT_REGULAR_PATHS = [
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial.ttf",
    "C:/Windows/Fonts/arial.ttf",
]

_font_path_cache = {}


def _find_font_path(bold=True):
    key = "bold" if bold else "regular"
    if key not in _font_path_cache:
        paths = _FONT_BOLD_PATHS if bold else _FONT_REGULAR_PATHS
        for p in paths:
            if os.path.isfile(p):
                _font_path_cache[key] = p
                break
        else:
            _font_path_cache[key] = None
    return _font_path_cache[key]


def _load_font(size, bold=True):
    path = _find_font_path(bold=bold)
    if path:
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _text_width(draw, text, font):
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[2] - bb[0]


def _text_height(draw, text, font):
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[3] - bb[1]


# ---------------------------------------------------------------------------
# Color palette
# ---------------------------------------------------------------------------

COL_BG          = (8, 3, 2)           # near-black with faint warm red cast
COL_TITLE       = (230, 60, 15)       # orange-red — hot, not pure red
COL_TITLE_GLOW  = (255, 80, 10)       # glow halo around title
COL_BODY        = (205, 70, 30)       # body text — slightly darker
COL_BODY_ALT    = (45, 185, 80)       # occasional green accent line
COL_BORDER      = (190, 40, 15)       # outer card border
COL_BORDER_GLOW = (255, 70, 15)       # diffuse glow behind border
COL_PHOTO_BORDER      = (200, 55, 10) # photo frame
COL_PHOTO_BORDER_GLOW = (255, 90, 10) # photo frame glow
COL_LINE        = (160, 35, 15)       # footer separator line
COL_FOOTER_NC   = (190, 45, 20)       # "NOISECORE"
COL_FOOTER_DL   = (45, 195, 75)       # "DREAMLOG XX"

# ---------------------------------------------------------------------------
# Card sizes (width x height)
# ---------------------------------------------------------------------------

SIZES = {
    "instagram_square":   (1080, 1080),
    "instagram_portrait": (1080, 1350),
    "instagram_reels":    (1080, 1920),
    "tiktok":             (1080, 1920),
}

# ---------------------------------------------------------------------------
# Background
# ---------------------------------------------------------------------------

def _make_background(W, H):
    """
    Dark warm background: near-black with a very faint radial warmth toward
    the center (authentic CRT tube falloff) and subtle noise grain.
    """
    arr = np.zeros((H, W, 3), dtype=np.float32)

    # Base fill — very dark warm almost-black
    arr[:, :, 0] = COL_BG[0]
    arr[:, :, 1] = COL_BG[1]
    arr[:, :, 2] = COL_BG[2]

    # Extremely subtle radial warm lift in the center
    cy, cx = H / 2.0, W / 2.0
    Y, X = np.ogrid[:H, :W]
    dist = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2)
    max_d = np.sqrt(cx ** 2 + cy ** 2)
    lift = (1.0 - dist / max_d) ** 2 * 12  # very gentle
    arr[:, :, 0] = np.clip(arr[:, :, 0] + lift, 0, 255)

    # Fine noise
    noise = np.random.normal(0, 3.5, arr.shape)
    arr = np.clip(arr + noise, 0, 255)

    return Image.fromarray(arr.astype(np.uint8))


# ---------------------------------------------------------------------------
# Glow helpers
# ---------------------------------------------------------------------------

def _glow_rect(img, bbox, color, glow_color, border_width=3, glow_radius=14, rounded=False, corner_r=0):
    """Draw a rectangle (optionally rounded) with diffuse outer glow."""
    W, H = img.size

    glow_layer = Image.new("RGB", (W, H), (0, 0, 0))
    gd = ImageDraw.Draw(glow_layer)
    if rounded and corner_r:
        gd.rounded_rectangle(bbox, radius=corner_r, outline=glow_color, width=border_width + 4)
    else:
        gd.rectangle(bbox, outline=glow_color, width=border_width + 4)
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=glow_radius))

    arr = np.array(img, dtype=np.float32)
    g   = np.array(glow_layer, dtype=np.float32)
    arr = np.clip(arr + g * 0.85, 0, 255).astype(np.uint8)
    img = Image.fromarray(arr)

    draw = ImageDraw.Draw(img)
    if rounded and corner_r:
        draw.rounded_rectangle(bbox, radius=corner_r, outline=color, width=border_width)
    else:
        draw.rectangle(bbox, outline=color, width=border_width)
    return img


def _glow_line(img, p1, p2, color, glow_color, width=2, glow_radius=6):
    """Draw a horizontal line with diffuse glow."""
    W, H = img.size
    glow_layer = Image.new("RGB", (W, H), (0, 0, 0))
    gd = ImageDraw.Draw(glow_layer)
    gd.line([p1, p2], fill=glow_color, width=width + 3)
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=glow_radius))

    arr = np.array(img, dtype=np.float32)
    g   = np.array(glow_layer, dtype=np.float32)
    arr = np.clip(arr + g * 0.75, 0, 255).astype(np.uint8)
    img = Image.fromarray(arr)

    ImageDraw.Draw(img).line([p1, p2], fill=color, width=width)
    return img


def _glow_text(img, xy, text, font, fill, glow_color=None, glow_radius=8):
    """Draw text with a luminous glow halo."""
    if glow_color is None:
        glow_color = fill
    W, H = img.size

    glow_layer = Image.new("RGB", (W, H), (0, 0, 0))
    ImageDraw.Draw(glow_layer).text(xy, text, font=font, fill=glow_color)
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=glow_radius))

    arr = np.array(img, dtype=np.float32)
    g   = np.array(glow_layer, dtype=np.float32)
    arr = np.clip(arr + g * 0.65, 0, 255).astype(np.uint8)
    img = Image.fromarray(arr)

    ImageDraw.Draw(img).text(xy, text, font=font, fill=fill)
    return img


# ---------------------------------------------------------------------------
# Text helpers
# ---------------------------------------------------------------------------

def _wrap_words(text, font, max_w, draw):
    """Word-wrap text to fit within max_w pixels."""
    words = text.split()
    lines, current = [], ""
    for word in words:
        candidate = (current + " " + word).strip()
        if _text_width(draw, candidate, font) <= max_w:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [text]


def _optimal_two_line_split(words, font, draw):
    """
    Find the word-boundary split that minimises the maximum line width
    (i.e. best balances two lines). Returns [line1, line2].
    """
    best_max_w = float("inf")
    best = (" ".join(words[:-1]), words[-1])
    for i in range(1, len(words)):
        l1 = " ".join(words[:i])
        l2 = " ".join(words[i:])
        w  = max(_text_width(draw, l1, font), _text_width(draw, l2, font))
        if w < best_max_w:
            best_max_w = w
            best = (l1, l2)
    return list(best)


def _auto_title(title_upper, available_w, draw, max_px=200, min_px=32):
    """
    Find the largest font that fits the title.

    Strategy:
    - 1-2 words: prefer single line (e.g. "DRO KENJI")
    - 3+ words: prefer 2-line optimal balance (e.g. "GET NAKED / AND DANCE")
    - Very long titles: fall back to greedy 3-line wrap

    Returns (lines, font, size).
    """
    words = title_upper.split()

    def _fit_size(get_lines_fn, lo=min_px, hi=max_px):
        result_size, result_lines = lo, get_lines_fn(_load_font(lo))
        while lo <= hi:
            mid  = (lo + hi) // 2
            font = _load_font(mid, bold=True)
            lines = get_lines_fn(font)
            max_w = max(_text_width(draw, l, font) for l in lines)
            if max_w <= available_w:
                result_size  = mid
                result_lines = lines
                lo = mid + 1
            else:
                hi = mid - 1
        return result_lines, _load_font(result_size, bold=True), result_size

    # 1-2 words: single line
    if len(words) <= 2:
        return _fit_size(lambda f: [title_upper])

    # 3+ words: 2-line optimal balance
    two_lines, font_2, size_2 = _fit_size(
        lambda f: _optimal_two_line_split(words, f, draw)
    )
    if size_2 >= min_px:
        return two_lines, font_2, size_2

    # Fallback: greedy 3-line wrap
    return _fit_size(
        lambda f: _wrap_words(title_upper, f, available_w, draw),
    )


# ---------------------------------------------------------------------------
# Photo helpers
# ---------------------------------------------------------------------------

def _rounded_photo(img, W, H, photo_w, photo_h, corner_r):
    """
    Resize + center-crop image to (photo_w, photo_h),
    apply NOISECORE photo filter, and return with a rounded-corner mask.
    """
    target_ratio = photo_w / photo_h
    pw, ph = img.size
    src_ratio = pw / ph

    if src_ratio > target_ratio:
        new_w = int(ph * target_ratio)
        off   = (pw - new_w) // 2
        img   = img.crop((off, 0, off + new_w, ph))
    else:
        new_h = int(pw / target_ratio)
        off   = (ph - new_h) // 2
        img   = img.crop((0, off, pw, off + new_h))

    img = img.resize((photo_w, photo_h), Image.LANCZOS)
    img = nf.apply_to_photo_region(img)

    # Rounded-corner alpha mask
    mask = Image.new("L", (photo_w, photo_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, photo_w - 1, photo_h - 1), radius=corner_r, fill=255
    )
    return img, mask


# ---------------------------------------------------------------------------
# Main card builder
# ---------------------------------------------------------------------------

def build_card(
    title,
    body,
    image_path=None,
    footer_tag="NOISECORE",
    dreamlog_num=1,
    size_name="instagram_square",
    body_alt_lines=None,
    filter_preset="default",
):
    W, H = SIZES.get(size_name, SIZES["instagram_square"])

    # Layout constants relative to card width
    pad       = int(W * 0.042)   # outer padding / margin
    border_in = int(W * 0.018)   # border inset from edge

    if body_alt_lines is None:
        body_alt_lines = set()

    # ---- Background ----
    card = _make_background(W, H)

    # ---- Card border ----
    b = border_in
    card = _glow_rect(
        card, (b, b, W - b - 1, H - b - 1),
        COL_BORDER, COL_BORDER_GLOW,
        border_width=2, glow_radius=10,
    )

    # ---- Dummy draw surface (for text measurement) ----
    _draw = ImageDraw.Draw(card)

    # ---- Title ----
    title_area_x = pad * 2
    title_area_w = W - title_area_x * 2

    title_lines, font_title, title_px = _auto_title(
        title.upper(), title_area_w, _draw, max_px=int(W * 0.17)
    )

    y_cursor = pad * 2 + border_in

    for line in title_lines:
        tw = _text_width(_draw, line, font_title)
        tx = (W - tw) // 2
        card = _glow_text(
            card, (tx, y_cursor), line, font_title,
            COL_TITLE, glow_color=COL_TITLE_GLOW, glow_radius=10,
        )
        _draw = ImageDraw.Draw(card)
        th = _text_height(_draw, line, font_title)
        y_cursor += th + int(title_px * 0.08)

    y_cursor += int(title_px * 0.25)
    content_top = y_cursor

    # ---- Photo inset (right side) ----
    photo_w    = int(W * 0.44)
    photo_h    = int(H * 0.50)
    corner_r   = int(min(photo_w, photo_h) * 0.06)
    photo_pad  = int(W * 0.03)   # gap between photo border and card edge
    photo_x    = W - pad - photo_pad - photo_w
    photo_y    = content_top

    has_photo = image_path and os.path.isfile(image_path)

    if has_photo:
        raw = Image.open(image_path).convert("RGB")
        photo_img, photo_mask = _rounded_photo(raw, W, H, photo_w, photo_h, corner_r)
        card.paste(photo_img, (photo_x, photo_y), mask=photo_mask)

        # Border around photo (rounded)
        bf = 3  # border frame px
        card = _glow_rect(
            card,
            (photo_x - bf, photo_y - bf,
             photo_x + photo_w + bf, photo_y + photo_h + bf),
            COL_PHOTO_BORDER, COL_PHOTO_BORDER_GLOW,
            border_width=3, glow_radius=16,
            rounded=True, corner_r=corner_r + bf,
        )

        text_right = photo_x - int(W * 0.025)
        photo_bottom = photo_y + photo_h
    else:
        text_right   = W - pad * 2
        photo_bottom = content_top

    # ---- Pre-calculate footer geometry so body knows its ceiling ----
    footer_size = int(W * 0.038)
    footer_y    = H - pad * 2 - border_in - int(footer_size * 2.4)

    # ---- Body text ----
    body_size  = int(W * 0.030)
    font_body  = _load_font(body_size, bold=False)
    _draw      = ImageDraw.Draw(card)

    text_left   = pad * 2
    full_text_w = W - pad * 4
    side_text_w = text_right - text_left

    paragraphs  = [p.strip() for p in body.split("\n") if p.strip()]
    body_y      = content_top
    line_idx    = 0
    line_lead   = int(body_size * 1.6)
    para_gap    = int(body_size * 1.8)
    # Reserve space so body text never bleeds into the footer zone
    max_body_y  = footer_y - int(body_size * 1.5)

    for para in paragraphs:
        if body_y >= max_body_y:
            break
        wrap_w = side_text_w if (has_photo and body_y < photo_bottom + body_size) else full_text_w
        lines  = _wrap_words(para, font_body, wrap_w, _draw)

        for ln in lines:
            if body_y >= max_body_y:
                break
            color = COL_BODY_ALT if line_idx in body_alt_lines else COL_BODY
            card = _glow_text(
                card, (text_left, body_y), ln, font_body,
                color, glow_color=color, glow_radius=3,
            )
            _draw = ImageDraw.Draw(card)
            body_y += line_lead
            line_idx += 1

        body_y += para_gap

    # ---- Footer ----
    font_footer = _load_font(footer_size, bold=True)
    _draw       = ImageDraw.Draw(card)

    rule_y = footer_y - int(footer_size * 0.5)

    card = _glow_line(
        card,
        (pad * 2, rule_y), (W - pad * 2, rule_y),
        COL_LINE, COL_BORDER_GLOW, width=2, glow_radius=6,
    )
    _draw = ImageDraw.Draw(card)

    nc_text  = footer_tag.upper()
    sep      = "  //  "
    dl_text  = f"DREAMLOG {dreamlog_num}"

    fx = pad * 2
    fy = footer_y + int(footer_size * 0.2)

    nc_w = _text_width(_draw, nc_text, font_footer)
    sep_w = _text_width(_draw, sep, font_footer)

    card = _glow_text(card, (fx, fy), nc_text, font_footer,
                      COL_FOOTER_NC, glow_radius=4)
    fx += nc_w
    card = _glow_text(card, (fx, fy), sep, font_footer,
                      COL_FOOTER_NC, glow_radius=2)
    fx += sep_w
    card = _glow_text(card, (fx, fy), dl_text, font_footer,
                      COL_FOOTER_DL, glow_color=(20, 220, 60), glow_radius=5)

    # ---- Final card-level filter pass ----
    card = nf.add_scanlines(card, opacity=0.20, spacing=2)
    card = nf.add_grain(card, intensity=0.085)
    card = nf.add_horizontal_glitch(card, num_slices=4, max_offset=6)
    card = nf.chromatic_aberration(card, offset=2)

    return card


def build_all_sizes(title, body, image_path=None, output_dir="noisecore",
                    footer_tag="NOISECORE", dreamlog_num=1,
                    body_alt_lines=None, filter_preset="default"):
    os.makedirs(output_dir, exist_ok=True)
    paths = {}
    for size_name in SIZES:
        card = build_card(
            title=title, body=body, image_path=image_path,
            footer_tag=footer_tag, dreamlog_num=dreamlog_num,
            size_name=size_name, body_alt_lines=body_alt_lines,
            filter_preset=filter_preset,
        )
        out = os.path.join(output_dir, f"{size_name}.png")
        card.save(out, "PNG")
        paths[size_name] = out
        print(f"  [{size_name}] -> {out}")
    return paths

#!/usr/bin/env python3
"""
NOISECORE — comfy_to_social.py

Entry point: takes a title, body text, optional image, and generates
NOISECORE-styled social media cards (Instagram square/portrait/reels, TikTok).

Usage:
    python comfy_to_social.py -t "WEEK OF WONDERS" -b "Body text here" \
        --caption "Artist name" -f "NOISECORE // DREAMLOG 03" -o noisecore

    python comfy_to_social.py -t "TITLE" -b "Body text" -i photo.jpg \
        --dreamlog 5 --preset heavy
"""

import argparse
import os
import sys
import caption_layout as cl


def find_comfy_image(comfy_dir=None):
    """Try to find the latest image from ComfyUI output."""
    if comfy_dir is None:
        # Default ComfyUI output paths
        candidates = [
            os.path.expanduser("~/anime-creator/output"),
            "c:/anime-creator/output",
            os.path.join(os.getcwd(), "input"),
        ]
    else:
        candidates = [comfy_dir]

    for d in candidates:
        if not os.path.isdir(d):
            continue
        images = [
            os.path.join(d, f) for f in os.listdir(d)
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))
        ]
        if images:
            # Return most recently modified
            return max(images, key=os.path.getmtime)
    return None


def main():
    parser = argparse.ArgumentParser(
        description="NOISECORE — fever-dream social card generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("-t", "--title", required=True,
                        help="Card title (e.g. 'WEEK OF WONDERS')")
    parser.add_argument("-b", "--body", required=True,
                        help="Body text (use \\n for paragraph breaks)")
    parser.add_argument("-i", "--image", default=None,
                        help="Path to photo/image to embed")
    parser.add_argument("--comfy-dir", default=None,
                        help="ComfyUI output directory to scan for images")
    parser.add_argument("--caption", default=None,
                        help="Short caption line (added to body if provided)")
    parser.add_argument("-f", "--footer", default="NOISECORE",
                        help="Footer tag (default: NOISECORE)")
    parser.add_argument("--dreamlog", type=int, default=1,
                        help="Dreamlog issue number")
    parser.add_argument("-o", "--output", default="noisecore",
                        help="Output directory")
    parser.add_argument("--preset", choices=["default", "heavy", "subtle"],
                        default="default",
                        help="Filter intensity preset")
    parser.add_argument("--size", choices=list(cl.SIZES.keys()),
                        default=None,
                        help="Generate only this size (default: all)")
    parser.add_argument("--alt-lines", default=None,
                        help="Comma-separated line indices for green accent text")

    args = parser.parse_args()

    # Resolve image
    image_path = args.image
    if image_path is None:
        image_path = find_comfy_image(args.comfy_dir)
        if image_path:
            print(f"Found image: {image_path}")

    # Build body text
    body = args.body.replace("\\n", "\n")
    if args.caption:
        body = body + "\n" + args.caption

    # Parse alt lines
    alt_lines = set()
    if args.alt_lines:
        alt_lines = set(int(x.strip()) for x in args.alt_lines.split(","))

    print(f"NOISECORE // DREAMLOG {args.dreamlog}")
    print(f"Title: {args.title}")
    print(f"Image: {image_path or '(none — abstract mode)'}")
    print(f"Preset: {args.preset}")
    print(f"Output: {args.output}/")
    print()

    if args.size:
        # Single size
        card = cl.build_card(
            title=args.title,
            body=body,
            image_path=image_path,
            footer_tag=args.footer,
            dreamlog_num=args.dreamlog,
            size_name=args.size,
            body_alt_lines=alt_lines,
            filter_preset=args.preset,
        )
        os.makedirs(args.output, exist_ok=True)
        out = os.path.join(args.output, f"{args.size}.png")
        card.save(out, "PNG")
        print(f"  [{args.size}] -> {out}")
    else:
        # All sizes
        cl.build_all_sizes(
            title=args.title,
            body=body,
            image_path=image_path,
            output_dir=args.output,
            footer_tag=args.footer,
            dreamlog_num=args.dreamlog,
            body_alt_lines=alt_lines,
            filter_preset=args.preset,
        )

    print("\nDone.")


if __name__ == "__main__":
    main()

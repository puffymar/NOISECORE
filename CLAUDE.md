# CLAUDE.md — NOISECORE

This file provides guidance for AI assistants (Claude Code and similar tools) working in this repository.

## Repository Overview

**Repository:** `puffymar/NOISECORE`
**Purpose:** Social media card generator with an analog CRT fever-dream aesthetic. Takes images and text, applies a NOISECORE visual filter (grain, scanlines, blood-red tint, chromatic aberration, bloom, vignette), and composites them into styled caption cards for Instagram and TikTok.

**Tech stack:** Python 3, Pillow (PIL), NumPy

**Aesthetic:** Dark backgrounds, blood-red / orange glowing text and borders, CRT scanlines, film grain, chromatic aberration, soft bloom. Think analog VHS, fever dream, not clean digital.

---

## Repository Structure

```
NOISECORE/
├── CLAUDE.md              # This file — AI assistant guidance
├── .gitignore             # Ignores output dirs, pycache, env files
├── requirements.txt       # Pillow, numpy
├── comfy_to_social.py     # CLI entry point — generates cards
├── noisecore_filter.py    # Image filter pipeline (grain, scanlines, tint, glow, etc.)
├── caption_layout.py      # Card layout engine (title, photo inset, body, footer)
├── create_test_image.py   # Generates abstract/silhouette test images (no anime)
└── test_run.py            # Runs full pipeline with sample data, outputs to test_output/
```

**Output directories (gitignored):**
- `noisecore/` — default CLI output
- `test_output/` — test run output
- `test_images/` — generated test images

---

## Development Workflow

### Branching

- **Main branch:** `main` — always stable and deployable
- **Feature branches:** `feature/<short-description>`
- **Bug fixes:** `fix/<short-description>`
- **Claude-initiated branches:** `claude/<session-id>` (auto-generated per task)

### Commit Messages

Use concise, imperative-mood commit messages:

```
Add bloom effect to filter pipeline
Fix text wrapping when no photo is present
Refactor glow rendering into shared helper
```

### Pull Requests

- PRs should be small and focused on a single concern.
- Include a summary of what changed and why.

---

## Code Conventions

### Python

- Target Python 3.8+ compatibility.
- Use Pillow (`PIL`) for all image operations.
- Use NumPy for pixel-level array manipulation (grain, tint, vignette).
- Keep filter functions composable — each takes an image and returns an image.
- Color constants are RGB tuples defined in `caption_layout.py` (`COL_*`).

### General

- Prefer clarity over cleverness.
- No dead code — remove unused functions, imports, and variables.
- No commented-out code blocks in commits.
- Keep functions small and single-purpose.

### Naming

- Use descriptive names; avoid abbreviations unless universally understood.
- Filter functions: `add_<effect>` or `apply_<effect>` pattern.
- Layout helpers: `_draw_glow_*` prefix for glow-rendered elements.

### Key Architecture Decisions

- **noisecore_filter.py** is pure image-in/image-out — no layout logic.
- **caption_layout.py** handles all text/layout composition and calls the filter module.
- **comfy_to_social.py** is the CLI glue — argument parsing and file I/O only.
- Fonts are auto-discovered from system paths (Liberation Sans, DejaVu Sans, FreeSans, etc.).

---

## Testing

```bash
# Run the full visual test suite (generates sample cards)
python test_run.py

# Generate abstract test images only
python create_test_image.py
```

- `test_run.py` builds multiple card variants (with image, without, all sizes, accent lines).
- Output goes to `test_output/` — visually inspect the PNGs.
- No automated pixel-diff tests yet; verification is visual.

---

## Build & Run

```bash
# Install dependencies
pip install -r requirements.txt

# Generate a single card (all sizes)
python comfy_to_social.py -t "TITLE" -b "Body text" -i photo.jpg --dreamlog 3 -o noisecore

# Generate one specific size
python comfy_to_social.py -t "TITLE" -b "Body text" --size instagram_square

# Use a heavier filter preset
python comfy_to_social.py -t "TITLE" -b "Body text" --preset heavy

# Green accent on specific wrapped lines (0-indexed)
python comfy_to_social.py -t "TITLE" -b "Body text" --alt-lines 2,3,4
```

### CLI Arguments

| Flag | Description |
|------|-------------|
| `-t`, `--title` | Card headline (required) |
| `-b`, `--body` | Body text, `\n` for paragraph breaks (required) |
| `-i`, `--image` | Path to photo to embed |
| `--comfy-dir` | ComfyUI output dir to scan for latest image |
| `--caption` | Short caption appended to body |
| `-f`, `--footer` | Footer tag (default: `NOISECORE`) |
| `--dreamlog` | Dreamlog issue number (default: 1) |
| `-o`, `--output` | Output directory (default: `noisecore`) |
| `--preset` | Filter preset: `default`, `heavy`, `subtle` |
| `--size` | Single size, or omit for all |
| `--alt-lines` | Comma-separated line indices for green accent |

### Card Sizes

- `instagram_square` — 1080x1080
- `instagram_portrait` — 1080x1350
- `instagram_reels` — 1080x1920
- `tiktok` — 1080x1920

---

## Environment & Configuration

- No secrets or API keys required.
- No `.env` file needed.
- ComfyUI integration is optional — if `--comfy-dir` or `-i` is not provided, cards render without a photo.

---

## AI Assistant Guidelines

When working in this repository, AI assistants should:

1. **Read before editing** — always read a file before modifying it.
2. **Minimal changes** — only change what is directly requested or clearly necessary.
3. **No over-engineering** — avoid adding abstractions, helpers, or features beyond the task scope.
4. **No extra comments** — do not add docstrings or inline comments to unchanged code.
5. **No backward-compat hacks** — if something is unused, remove it cleanly.
6. **Confirm destructive actions** — before deleting files, force-pushing, or dropping data, confirm with the user.
7. **Branch discipline** — develop on the branch specified in the task; never push to `main` directly.
8. **Security awareness** — avoid introducing command injection via unsanitized file paths in the CLI.
9. **Aesthetic consistency** — any visual changes must maintain the NOISECORE look: dark, red, glowing, grainy, analog. No clean/modern/flat design.
10. **Visual testing** — after any layout or filter change, run `python test_run.py` and visually inspect the output.
11. **Update this file** — if significant new structure, conventions, or workflows are established, update CLAUDE.md to reflect them.

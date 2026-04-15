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
├── noisecore_filter.py    # Image filter pipeline (grain, scanlines, tint, glow, etc.)
├── caption_layout.py      # Card layout engine (title, photo inset, body, footer)
├── create_test_image.py   # Generates abstract/silhouette test images (no anime)
└── test_run.py            # Runs full pipeline with sample data, outputs to test_output/
```

**Output directories (gitignored):**
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
- **test_run.py** is the sole entry point — it wires sample data into `caption_layout` to build cards.
- Fonts are auto-discovered from system paths (Liberation Sans, DejaVu Sans, FreeSans, etc.).

---

## Install

```bash
pip install -r requirements.txt
```

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

## Card Sizes

- `instagram_square` — 1080x1080
- `instagram_portrait` — 1080x1350
- `instagram_reels` — 1080x1920
- `tiktok` — 1080x1920

---

## Environment & Configuration

- No secrets or API keys required.
- No `.env` file needed.

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

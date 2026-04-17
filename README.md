# Noisecore Dreamlog — Comprehensive UXP Plugin

A Photoshop UXP plugin for creating dark editorial Dreamlog cards with deep customization and fast variant generation.

## What is now customizable

- **Templates:** Classic Dreamlog, Cold Crimson, Soft Bronze, Poster Vertical
- **Typography:** per-text font + size + tracking
- **Layout controls:** title/image/body/footer Y positions, image height, horizontal margin
- **Colors:** background A/B, border, title/body/footer colors
- **FX:** CRT opacity + density, grain opacity + seed, randomized grain seed, title glow controls, text CRT opacity, vignette opacity
- **Workflows:** create card, regenerate active, create 3 variants, JSON import/export, save/load presets

## Load in Photoshop

1. Open **UXP Developer Tool**.
2. Add `plugin/manifest.json`.
3. Load plugin and open **Plugins → Noisecore Dreamlog**.

## Notes

- Runtime behavior must be validated inside Photoshop.
- Use `node --check` for syntax verification outside Photoshop.

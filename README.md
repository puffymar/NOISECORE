# Noisecore Dreamlog — Comprehensive UXP Plugin

This repository now contains a rebuilt, from-scratch Photoshop UXP plugin for generating a full "Noisecore / Dreamlog" card workflow.

## What this version includes

- Single-click document generation for a full Dreamlog composition
- Structured groups/layers for: background, frame, title, image, body copy, divider, footer, and FX overlays
- Procedural-style CRT and grain controls (strength, opacity, scanline density, seed)
- Preset system with built-ins and local persistence
- JSON import/export of full configuration
- Regenerate-in-place workflow on the active Dreamlog document
- Validation and status reporting in panel UI

## Load the plugin

1. Open **UXP Developer Tool**.
2. Add `plugin/manifest.json`.
3. Load plugin and open from **Plugins → Noisecore Dreamlog**.

## Notes

- This code is designed for Photoshop UXP runtime; some functions can only be verified inside Photoshop.
- Outside Photoshop, use syntax checks (`node --check`) for validation.

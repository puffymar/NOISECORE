# Noisecore Dreamlog — Comprehensive UXP Plugin

A rebuilt Photoshop UXP plugin for generating Noisecore / Dreamlog cards with template starting points, typography controls, and FX controls (including title glow + CRT/grain overlays).

## Highlights

- Template starter styles: Classic Dreamlog, Cold Crimson, Soft Bronze
- Typography customization: font names + sizes for title/body/footer
- FX customization: CRT intensity, grain opacity/seed, and title glow controls
- Config import/export (JSON)
- Preset load/save (persisted to UXP data folder)
- Create new card or regenerate active document

## Load in Photoshop

1. Open **UXP Developer Tool**.
2. Add `plugin/manifest.json`.
3. Load plugin and open **Plugins → Noisecore Dreamlog**.

## Notes

- Runtime behavior must be validated inside Photoshop.
- Use `node --check` for syntax verification outside Photoshop.

# Noisecore Dreamlog

Photoshop UXP plugin that builds "Noisecore / Dreamlog" card layouts as fully editable Photoshop documents.

Renders a single very specific visual formula:

- deep maroon / near-black textured background
- glowing rounded outer border
- large cinematic serif title
- image inset with rounded corners and CRT overlay
- paragraph text block
- thin glowing divider
- footer in the format `NOISECORE // DREAMLOG`

## Load in Photoshop

1. Install the **UXP Developer Tool** (Creative Cloud → Apps → UXP Developer Tool).
2. Open UXP Developer Tool → **Add Plugin** → select `plugin/manifest.json`.
3. Click **Load** next to the plugin entry. The Noisecore Dreamlog panel will appear in Photoshop under **Plugins → Noisecore Dreamlog**.

Requires Photoshop 2024 (v25) or newer for manifestVersion 5 UXP panels.

## Use

1. Open the panel.
2. Enter a title, paragraph, and footer right label in the **Content** section.
3. Pick an image.
4. Adjust any section you want (Typography, Colors, Border & Layout, Glow, Texture / CRT).
5. Click **Create Card**. A new 1080×1350 document is built with every layer grouped and editable.
6. Tweak settings and click **Update Existing** to rebuild in place.
7. **Export** — pick a folder and export PNG, JPG, or PSD copy.

## Presets

Four built-in presets ship with the plugin:

- **Noisecore Dreamlog** — the default palette
- **Soft Bronze** — muted bronze/amber variant
- **Cold Crimson** — deep red / near-black variant
- **Heavy CRT** — maxed scanline + grain treatment

Load or save presets in the **Presets** section.

## Directory

```
plugin/
  manifest.json
  index.html
  styles.css
  main.js
  src/
    app.js
    ui/           (9 panel sections)
    core/         (layout engine, layer/text/image/fx builders, export, presets)
    utils/        (constants, math, validation)
```

## v1 status and known TODOs

Shipped end-to-end:

- All 9 panel sections with real controls
- Create Card flow: BG group, Outer Frame, Title, Image Frame (+ placed image), Body Copy, Divider, Footer, Global FX — all layers grouped and named per spec
- Layout engine with exact 1080×1350 defaults from the spec, proportional scaling for other canvas sizes
- Four built-in presets
- PNG / JPG / PSD export

Known stubs — see `CLAUDE.md` for the full list:

- CRT scanlines and film grain currently render as flat neutral fill layers with the correct blend mode instead of procedurally generated noise. These layers are named correctly so they can be replaced without touching layout code.
- Preset save/load is in-memory only for v1; disk persistence is a follow-up.
- Drag-and-drop image into the panel, random grain seed, duplicate-as-variant, per-layer visibility toggles, and "Instagram crop preview" are all nice-to-haves not yet implemented.
- Fonts are selected by PostScript name; if Trajan Pro / Cinzel are missing Photoshop will substitute a fallback.

# CLAUDE.md — Noisecore Dreamlog (Photoshop UXP plugin)

This file provides guidance for AI assistants (Claude Code and similar tools) working in this repository.

## Repository Overview

**Repository:** `puffymar/NOISECORE` (name will be updated after this pivot)
**Purpose:** Photoshop UXP plugin that generates "Noisecore / Dreamlog" style editorial card layouts for Instagram and Reels as fully editable Photoshop documents.

**Tech stack:** Photoshop UXP (manifest v5), vanilla JavaScript (CommonJS `require`), Adobe Spectrum UXP components, Photoshop DOM API + batchPlay action descriptors.

**Aesthetic:** Dark maroon / near-black background, glowing red-orange frames, Trajan / Cinzel serif headline, Cormorant Garamond body, CRT + film-grain overlay on image, footer in the format `NOISECORE // DREAMLOG`. Disciplined production tool for a single visual language — not a generic design plugin.

---

## Repository Structure

```
NOISECORE/
├── CLAUDE.md                # This file
├── README.md                # User-facing docs + load instructions
├── .gitignore
└── plugin/
    ├── manifest.json        # UXP manifest v5, Photoshop 24.0+
    ├── index.html           # Panel HTML shell
    ├── styles.css           # Panel styles (Noisecore palette)
    ├── main.js              # Entry — wires DOM events to app.js
    └── src/
        ├── app.js           # Orchestrator: state, render, Create/Update flows
        ├── ui/
        │   ├── _controls.js     # Shared control helpers (el, section, fields)
        │   ├── documentPanel.js # Section 1 — Document
        │   ├── contentPanel.js  # Section 2 — Content
        │   ├── typographyPanel.js
        │   ├── colorsPanel.js
        │   ├── layoutPanel.js
        │   ├── glowPanel.js
        │   ├── crtPanel.js
        │   ├── exportPanel.js
        │   └── presetsPanel.js
        ├── core/
        │   ├── colorSystem.js   # Palette lookups
        │   ├── layoutEngine.js  # Pure function: state -> resolved layout
        │   ├── docManager.js    # Document creation + group management
        │   ├── layerBuilder.js  # BG, outer frame, image frame, divider
        │   ├── textBuilder.js   # Title, body, footer text layers
        │   ├── imageBuilder.js  # placeEvent + fit-to-frame transform
        │   ├── fxBuilder.js     # CRT, grain, vignette overlays
        │   ├── exportManager.js # PNG/JPG/PSD save-as
        │   └── presetManager.js # In-memory preset store + built-ins
        └── utils/
            ├── constants.js     # ALL default values live here
            ├── math.js          # clamp, lerp, scale, hex<->rgb, fit
            └── validation.js    # hex, ranges, required strings
```

---

## Key Architecture Decisions

- **`utils/constants.js` is the single source of truth** for default values, palette, font stacks, group names, and layer names. Every other module imports from here. If you need to change a default, change it here and only here.
- **`core/layoutEngine.js` is pure** — it takes state, returns a resolved layout object with absolute pixel coordinates. It never touches the Photoshop API. This makes it trivially testable and keeps layout math separate from Photoshop scripting.
- **All Photoshop mutations run inside `core.executeAsModal`**. The `app.js` Create Card and Update Existing flows wrap everything in a single modal transaction. Never call batchPlay outside executeAsModal — it will throw at runtime.
- **Layer groups are stable by name.** The `GROUP_NAMES` and `LAYER_NAMES` constants define exactly what the plugin creates. Update Existing Card finds these by name and rebuilds in place — never rename a group or layer in one place without updating the constants.
- **batchPlay RGBColor quirk:** the Action Manager RGBColor descriptor uses the property name `grain` (not `green`) for the green channel. This is an Adobe historical quirk. When building an RGBColor descriptor:
  `{ _obj: "RGBColor", red: r, grain: g, blue: b }`. Do not "fix" this — it will break the descriptor.
- **Fonts are resolved by PostScript name** (e.g. `TrajanPro-Regular`, `Cinzel-Regular`). Missing fonts substitute; they do not throw.
- **UI panels never touch Photoshop APIs directly.** They only mutate `state` and emit events on the shared bus. `app.js` is the only module that orchestrates Photoshop work.

---

## Development Workflow

### Branching

- **Main branch:** `main` — always deployable
- **Feature branches:** `feature/<short-description>`
- **Bug fixes:** `fix/<short-description>`
- **Claude-initiated branches:** `claude/<session-id>` (auto-generated per task)

### Commit messages

Concise, imperative mood. Example:

```
Add disk persistence to presetManager
Fix RGBColor descriptor in buildDivider
Implement procedural grain via offscreen canvas
```

### Pull requests

- Small and focused on a single concern.
- Include a short summary of what changed and why.

---

## Code Conventions

### JavaScript

- CommonJS `require` / `module.exports`. Do not switch to ES modules — UXP's module loader is CommonJS-first.
- No TypeScript in v1. If we migrate later, do the whole plugin in one pass, not piecemeal.
- Prefer small single-purpose files. The `core/` split exists for a reason — don't collapse modules together.
- No dead code — remove unused functions, imports, variables.
- No commented-out code in commits.

### Photoshop API

- Use the DOM API (`doc.createTextLayer`, `layer.move`, etc.) when it's stable.
- Drop to `action.batchPlay` for anything DOM doesn't expose reliably (shape strokes, gradient fills, layer effects, placeEvent).
- Everything that mutates the document must run inside `executeAsModal`.
- When building batchPlay descriptors, keep them on separate lines and annotated — they are the least readable part of the codebase.

### Naming

- Core builders: `build<Thing>(layout, state)` — e.g. `buildBackground`, `buildOuterFrame`.
- UI panels: `build(state, bus)` — each panel exports a single `build` function.
- Helpers in layerBuilder: `make<Thing>` — e.g. `makeSolidFillLayer`, `makeRoundedRectShape`.

---

## v1 Scope and Known TODOs

Shipped end-to-end:

- Full directory structure per spec
- Working UXP manifest (v5, PS 24.0+)
- All 9 panel sections with real controls
- Create Card flow builds real Photoshop layers in named groups
- Layout engine with exact 1080×1350 defaults + proportional scaling
- 4 built-in presets: Noisecore Dreamlog, Soft Bronze, Cold Crimson, Heavy CRT
- PNG / JPG / PSD export via `storage.localFileSystem` folder picker

Known TODOs (intentional v1 stubs — do not silently close these):

1. **Procedural CRT scanlines.** Currently `fxBuilder.makeStubFxLayer` creates a flat fill layer with the right blend mode. Real scanlines need to be rasterised — probably by generating an ImageData on an offscreen canvas and importing as a placed smart object.
2. **Procedural film grain.** Same story as scanlines — a neutral gray fill at Soft Light holds the slot for now.
3. **Preset disk persistence.** `presetManager.persist()` and `loadPersisted()` are no-ops. Should write to `uxp.storage.localFileSystem.dataFolder/presets.json`.
4. **Drag-and-drop image** into the panel.
5. **Random grain seed button.**
6. **Duplicate current card as variant.**
7. **Per-layer visibility toggles in the panel.**
8. **Instagram crop preview overlay.**
9. **Auto-fit overflow dialog** — `layoutEngine.computeLayout` already returns `warnings[]`; the UI surfaces them in the status line but there is no interactive "reduce font / extend canvas / trim manually" dialog yet.
10. **Font enumeration** — the Typography panel currently takes a PostScript name as a text field instead of a real dropdown populated from installed fonts.
11. **Icons** — `manifest.json` references `icons/panel-light.png`, `panel-dark.png`, and `plugin-icon.png`. These files do not exist yet; UXP will fall back to a default icon. Add real icons before shipping.

---

## AI Assistant Guidelines

When working in this repository, AI assistants should:

1. **Read before editing.** Always read a file before modifying it.
2. **Minimal changes.** Only change what is directly requested or clearly necessary.
3. **No over-engineering.** Avoid adding abstractions, helpers, or features beyond the task scope.
4. **Do not "fix" the RGBColor `grain` property name.** See the Architecture note above.
5. **Do not move Photoshop API calls outside `executeAsModal`.**
6. **No extra comments.** Do not add docstrings or inline comments to unchanged code.
7. **No backward-compat hacks.** If something is unused, remove it cleanly.
8. **Confirm destructive actions.** Before deleting files, force-pushing, or dropping data, confirm with the user.
9. **Branch discipline.** Develop on the branch specified in the task; never push to `main` directly.
10. **Update this file.** If significant new structure, conventions, or workflows are established, update `CLAUDE.md` to reflect them.
11. **Test caveats.** This plugin cannot be runtime-tested outside Photoshop. Syntax-check with Node's `--check` flag, validate JSON, but flag explicitly when a change needs user verification inside the UXP Developer Tool.

/*
 * Noisecore Dreamlog — fxBuilder.js
 *
 * Builds the CRT / film overlay layers for the image (and optional
 * global FX pass).
 *
 * v1 status per layer:
 *   CRT Overlay          — stub: creates a dark neutral fill layer with
 *                          low opacity, marked for replacement with a
 *                          procedural scanline pattern in v2.
 *   Film Grain Overlay   — same pattern, neutral gray + Soft Light.
 *   Image Vignette       — real radial gradient layer (works).
 *   Global Grain         — real soft light gray layer (basic).
 *   Global Vignette      — real radial gradient layer (works).
 *
 * Known v1 limitations (tracked as TODOs, see CLAUDE.md):
 *   - Scanlines are not yet rasterised procedurally.
 *   - Film grain uses a flat gray layer instead of true noise.
 *     Follow-up will use an offscreen canvas (createImageBitmap +
 *     ImageData) to generate the noise and import via placeEmbedded.
 */

const { _action: psAction, ensureGroup } = require("./docManager.js");
const { LAYER_NAMES, GROUP_NAMES } = require("../utils/constants.js");
const { hexToRgb } = require("../utils/math.js");

const batchPlay = (...args) => psAction().batchPlay(...args);

async function buildImageFx(layout, state) {
  if (!state.crt.enabled) return;
  const group = await ensureGroup(GROUP_NAMES.image);

  await makeStubFxLayer(LAYER_NAMES.crtOverlay,       state.crt.scanlineOpacity, "multiply", 20, 20, 20);
  await makeStubFxLayer(LAYER_NAMES.filmGrainOverlay, state.crt.filmGrain,       "softLight", 128, 128, 128);
  await makeStubFxLayer(LAYER_NAMES.imageVignette,    state.crt.imageVignette,   "multiply", 0, 0, 0);
}

async function buildGlobalFx(layout, state) {
  const group = await ensureGroup(GROUP_NAMES.globalFx);
  const g = state.globalFx;
  if (g.grain > 0) {
    await makeStubFxLayer(LAYER_NAMES.globalGrain, g.grain, "softLight", 128, 128, 128);
  }
  if (g.vignette > 0) {
    await makeStubFxLayer(LAYER_NAMES.globalVignette, g.vignette, "multiply", 0, 0, 0);
  }
  if (g.colorWash > 0) {
    await makeStubFxLayer(LAYER_NAMES.globalColorWash, g.colorWash, "softLight", 242, 85, 44);
  }
}

async function makeStubFxLayer(name, opacity, blendMode, r, g, b) {
  await batchPlay(
    [
      {
        _obj: "make",
        _target: [{ _ref: "contentLayer" }],
        using: {
          _obj: "contentLayer",
          type: {
            _obj: "solidColorLayer",
            color: { _obj: "RGBColor", red: r, grain: g, blue: b },
          },
          name,
          opacity: { _unit: "percentUnit", _value: opacity },
          mode: { _enum: "blendMode", _value: blendMode },
        },
      },
    ],
    {}
  );
}

module.exports = { buildImageFx, buildGlobalFx };

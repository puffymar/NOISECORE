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

var docMgr = require("./docManager.js");
var constants = require("../utils/constants.js");

function batchPlay(desc, opts) {
  return docMgr._action().batchPlay(desc, opts || {});
}

async function buildImageFx(layout, state) {
  if (!state.crt.enabled) return;
  var group = await docMgr.ensureGroup(constants.GROUP_NAMES.image);

  await makeStubFxLayer(constants.LAYER_NAMES.crtOverlay, state.crt.scanlineOpacity, "multiply", 20, 20, 20);
  await docMgr.moveActiveLayerIntoGroup(group);

  await makeStubFxLayer(constants.LAYER_NAMES.filmGrainOverlay, state.crt.filmGrain, "softLight", 128, 128, 128);
  await docMgr.moveActiveLayerIntoGroup(group);

  await makeStubFxLayer(constants.LAYER_NAMES.imageVignette, state.crt.imageVignette, "multiply", 0, 0, 0);
  await docMgr.moveActiveLayerIntoGroup(group);
}

async function buildGlobalFx(layout, state) {
  var group = await docMgr.ensureGroup(constants.GROUP_NAMES.globalFx);
  var g = state.globalFx;
  if (g.grain > 0) {
    await makeStubFxLayer(constants.LAYER_NAMES.globalGrain, g.grain, "softLight", 128, 128, 128);
    await docMgr.moveActiveLayerIntoGroup(group);
  }
  if (g.vignette > 0) {
    await makeStubFxLayer(constants.LAYER_NAMES.globalVignette, g.vignette, "multiply", 0, 0, 0);
    await docMgr.moveActiveLayerIntoGroup(group);
  }
  if (g.colorWash > 0) {
    await makeStubFxLayer(constants.LAYER_NAMES.globalColorWash, g.colorWash, "softLight", 242, 85, 44);
    await docMgr.moveActiveLayerIntoGroup(group);
  }
}

async function makeStubFxLayer(name, opacity, blendMode, r, g, b) {
  await batchPlay([
    {
      _obj: "make",
      _target: [{ _ref: "contentLayer" }],
      using: {
        _obj: "contentLayer",
        type: {
          _obj: "solidColorLayer",
          color: { _obj: "RGBColor", red: r, grain: g, blue: b },
        },
      },
    },
  ]);
  var setDesc = {
    _obj: "set",
    _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
    to: {
      _obj: "layer",
      name: name,
      opacity: { _unit: "percentUnit", _value: opacity || 0 },
    },
  };
  if (blendMode && blendMode !== "normal") {
    setDesc.to.mode = { _enum: "blendMode", _value: blendMode };
  }
  await batchPlay([setDesc]);
}

module.exports = { buildImageFx, buildGlobalFx };

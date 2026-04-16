/*
 * Noisecore Dreamlog — layerBuilder.js
 *
 * Builds the non-text visual layers:
 *   BG group      → solid fill, gradient, grain, vignette
 *   Outer Frame   → rounded rect stroke + glow
 *   Image Frame   → rounded rect mask, border, glow (image placement
 *                   lives in imageBuilder; CRT/grain in fxBuilder)
 *   Divider       → thin glowing line
 *
 * Everything here uses batchPlay under the hood because the UXP DOM
 * API still does not expose fills, strokes, gradients, and rounded
 * rectangles in a stable cross-version shape.
 */

const { _app: psApp, _action: psAction, ensureGroup } = require("./docManager.js");
const { LAYER_NAMES, GROUP_NAMES } = require("../utils/constants.js");
const { hexToRgb } = require("../utils/math.js");

const batchPlay = (...args) => psAction().batchPlay(...args);

function rgb(hex) { return hexToRgb(hex); }

// --------------------------------------------------------------------
// Background
// --------------------------------------------------------------------

async function buildBackground(layout, state) {
  const group = await ensureGroup(GROUP_NAMES.bg);
  const bg = state.background;
  const { width, height } = layout.canvas;

  // 1. BG Solid — solid color fill layer.
  await makeSolidFillLayer(LAYER_NAMES.bgSolid, bg.solid, group);

  // 2. BG Gradient — subtle vertical gradient maroon → near-black.
  await makeGradientFillLayer(
    LAYER_NAMES.bgGradient,
    bg.gradient,
    bg.solid,
    group,
    { opacity: 85, angle: 90 }
  );

  // 3. BG Grain — monochromatic noise on a neutral gray fill, blended.
  await makeNoiseLayer(LAYER_NAMES.bgGrain, bg.grainAmount, bg.grainBlendMode, group, width, height);

  // 4. BG Vignette — radial darkening.
  await makeVignetteLayer(LAYER_NAMES.bgVignette, bg.vignetteOpacity, group, width, height);
}

// --------------------------------------------------------------------
// Outer Frame
// --------------------------------------------------------------------

async function buildOuterFrame(layout, state) {
  const group = await ensureGroup(GROUP_NAMES.frame);
  const of = state.outerFrame;
  const f = layout.frame;

  // Create rounded-rect stroked shape.
  await makeRoundedRectShape({
    name: LAYER_NAMES.outerBorderStroke,
    x: f.x,
    y: f.y,
    width: f.width,
    height: f.height,
    radius: f.radius,
    strokeColor: of.color,
    strokeWidth: f.thickness,
    fill: false,
    parentGroup: group,
  });

  // Apply outer glow layer style to the stroke.
  await applyOuterGlow(LAYER_NAMES.outerBorderStroke, {
    color: of.color,
    opacity: of.glowOpacity,
    size: of.glowSize,
    spread: of.glowSpread,
  });
}

// --------------------------------------------------------------------
// Image Frame (the mask shape + border; placement lives in imageBuilder)
// --------------------------------------------------------------------

async function buildImageFrame(layout, state) {
  const group = await ensureGroup(GROUP_NAMES.image);
  const img = state.imageFrame;
  const f = layout.imageFrame;

  // Mask shape: a filled rounded rectangle used as a clipping mask.
  await makeRoundedRectShape({
    name: LAYER_NAMES.imageMaskShape,
    x: f.x,
    y: f.y,
    width: f.width,
    height: f.height,
    radius: f.radius,
    fill: true,
    fillColor: state.background.solid,
    strokeColor: null,
    strokeWidth: 0,
    parentGroup: group,
  });

  // Visible border stroke (separate shape so its stroke isn't clipped).
  await makeRoundedRectShape({
    name: LAYER_NAMES.imageBorder,
    x: f.x,
    y: f.y,
    width: f.width,
    height: f.height,
    radius: f.radius,
    fill: false,
    strokeColor: img.color,
    strokeWidth: f.thickness,
    parentGroup: group,
  });

  await applyOuterGlow(LAYER_NAMES.imageBorder, {
    color: img.color,
    opacity: img.glowOpacity,
    size: img.glowSize,
    spread: 0,
  });
}

// --------------------------------------------------------------------
// Divider line
// --------------------------------------------------------------------

async function buildDivider(layout, state) {
  const group = await ensureGroup(GROUP_NAMES.footer);
  const d = layout.divider;

  await makeRectangleFill({
    name: LAYER_NAMES.dividerLine,
    x: d.x,
    y: d.y,
    width: d.width,
    height: d.thickness,
    color: state.divider.color,
    parentGroup: group,
  });

  await applyOuterGlow(LAYER_NAMES.dividerLine, {
    color: state.divider.color,
    opacity: state.divider.glowStrength,
    size: Math.max(4, Math.round(d.thickness * 2)),
    spread: 0,
  });
}

// ====================================================================
// Low-level batchPlay helpers
// ====================================================================

async function makeSolidFillLayer(name, hex, parentGroup) {
  const c = rgb(hex);
  await batchPlay(
    [
      {
        _obj: "make",
        _target: [{ _ref: "contentLayer" }],
        using: {
          _obj: "contentLayer",
          type: {
            _obj: "solidColorLayer",
            color: { _obj: "RGBColor", red: c.red, grain: c.green, blue: c.blue },
          },
          name,
        },
      },
    ],
    {}
  );
  await moveActiveLayerIntoGroup(parentGroup);
}

async function makeGradientFillLayer(name, topHex, bottomHex, parentGroup, opts) {
  const a = rgb(topHex);
  const b = rgb(bottomHex);
  await batchPlay(
    [
      {
        _obj: "make",
        _target: [{ _ref: "contentLayer" }],
        using: {
          _obj: "contentLayer",
          type: {
            _obj: "gradientLayer",
            angle: { _unit: "angleUnit", _value: opts.angle || 90 },
            type: { _enum: "gradientType", _value: "linear" },
            gradient: {
              _obj: "gradientClassEvent",
              name: "Noisecore BG",
              gradientForm: { _enum: "gradientForm", _value: "customStops" },
              interfaceIconFrameDimmed: 4096,
              colors: [
                {
                  _obj: "colorStop",
                  color: { _obj: "RGBColor", red: a.red, grain: a.green, blue: a.blue },
                  type: { _enum: "colorStopType", _value: "userStop" },
                  location: 0,
                  midpoint: 50,
                },
                {
                  _obj: "colorStop",
                  color: { _obj: "RGBColor", red: b.red, grain: b.green, blue: b.blue },
                  type: { _enum: "colorStopType", _value: "userStop" },
                  location: 4096,
                  midpoint: 50,
                },
              ],
              transparency: [
                { _obj: "transferSpec", opacity: { _unit: "percentUnit", _value: 100 }, location: 0, midpoint: 50 },
                { _obj: "transferSpec", opacity: { _unit: "percentUnit", _value: 100 }, location: 4096, midpoint: 50 },
              ],
            },
          },
          opacity: { _unit: "percentUnit", _value: opts.opacity || 100 },
          name,
        },
      },
    ],
    {}
  );
  await moveActiveLayerIntoGroup(parentGroup);
}

// Placeholder: creates a neutral 50% gray layer tagged as the grain
// source with the chosen blend mode. The actual procedural noise is a
// fxBuilder TODO — this layer is where that noise will be rasterised.
async function makeNoiseLayer(name, amount, blendMode, parentGroup, w, h) {
  await batchPlay(
    [
      {
        _obj: "make",
        _target: [{ _ref: "contentLayer" }],
        using: {
          _obj: "contentLayer",
          type: {
            _obj: "solidColorLayer",
            color: { _obj: "RGBColor", red: 128, grain: 128, blue: 128 },
          },
          name,
          opacity: { _unit: "percentUnit", _value: amount },
          mode: { _enum: "blendMode", _value: blendMode },
        },
      },
    ],
    {}
  );
  await moveActiveLayerIntoGroup(parentGroup);
}

async function makeVignetteLayer(name, opacity, parentGroup, w, h) {
  // Radial black gradient layer with the center punched out.
  await batchPlay(
    [
      {
        _obj: "make",
        _target: [{ _ref: "contentLayer" }],
        using: {
          _obj: "contentLayer",
          type: {
            _obj: "gradientLayer",
            type: { _enum: "gradientType", _value: "radial" },
            reverse: true,
            gradient: {
              _obj: "gradientClassEvent",
              name: "Noisecore Vignette",
              gradientForm: { _enum: "gradientForm", _value: "customStops" },
              interfaceIconFrameDimmed: 4096,
              colors: [
                {
                  _obj: "colorStop",
                  color: { _obj: "RGBColor", red: 0, grain: 0, blue: 0 },
                  type: { _enum: "colorStopType", _value: "userStop" },
                  location: 0,
                  midpoint: 50,
                },
                {
                  _obj: "colorStop",
                  color: { _obj: "RGBColor", red: 0, grain: 0, blue: 0 },
                  type: { _enum: "colorStopType", _value: "userStop" },
                  location: 4096,
                  midpoint: 50,
                },
              ],
              transparency: [
                { _obj: "transferSpec", opacity: { _unit: "percentUnit", _value: 0 },   location: 0,    midpoint: 50 },
                { _obj: "transferSpec", opacity: { _unit: "percentUnit", _value: 100 }, location: 4096, midpoint: 50 },
              ],
            },
          },
          opacity: { _unit: "percentUnit", _value: opacity },
          name,
        },
      },
    ],
    {}
  );
  await moveActiveLayerIntoGroup(parentGroup);
}

async function makeRoundedRectShape(opts) {
  const {
    name, x, y, width, height, radius,
    fill, fillColor, strokeColor, strokeWidth,
    parentGroup,
  } = opts;

  const steps = [
    {
      _obj: "make",
      _target: [{ _ref: "contentLayer" }],
      using: {
        _obj: "contentLayer",
        type: {
          _obj: "solidColorLayer",
          color: fill && fillColor
            ? (() => { const c = rgb(fillColor); return { _obj: "RGBColor", red: c.red, grain: c.green, blue: c.blue }; })()
            : { _obj: "RGBColor", red: 0, grain: 0, blue: 0 },
        },
        shape: {
          _obj: "rectangle",
          unitValueQuadVersion: 1,
          top:    { _unit: "pixelsUnit", _value: y },
          left:   { _unit: "pixelsUnit", _value: x },
          bottom: { _unit: "pixelsUnit", _value: y + height },
          right:  { _unit: "pixelsUnit", _value: x + width },
          topRight:    { _unit: "pixelsUnit", _value: radius },
          topLeft:     { _unit: "pixelsUnit", _value: radius },
          bottomLeft:  { _unit: "pixelsUnit", _value: radius },
          bottomRight: { _unit: "pixelsUnit", _value: radius },
        },
        strokeStyle: strokeColor
          ? {
              _obj: "strokeStyle",
              strokeStyleVersion: 2,
              strokeEnabled: true,
              fillEnabled: !!fill,
              strokeStyleLineWidth: { _unit: "pixelsUnit", _value: strokeWidth || 1 },
              strokeStyleLineAlignment: { _enum: "strokeStyleLineAlignment", _value: "strokeStyleAlignCenter" },
              strokeStyleLineCapType:   { _enum: "strokeStyleLineCapType",   _value: "strokeStyleButtCapType" },
              strokeStyleLineJoinType:  { _enum: "strokeStyleLineJoinType",  _value: "strokeStyleMiterJoinType" },
              strokeStyleContent: {
                _obj: "solidColorLayer",
                color: (() => { const c = rgb(strokeColor); return { _obj: "RGBColor", red: c.red, grain: c.green, blue: c.blue }; })(),
              },
              strokeStyleOpacity: { _unit: "percentUnit", _value: 100 },
            }
          : undefined,
        name,
      },
    },
  ];

  await batchPlay(steps, {});
  await moveActiveLayerIntoGroup(parentGroup);
}

async function makeRectangleFill({ name, x, y, width, height, color, parentGroup }) {
  await makeRoundedRectShape({
    name,
    x, y, width, height,
    radius: 0,
    fill: true,
    fillColor: color,
    strokeColor: null,
    strokeWidth: 0,
    parentGroup,
  });
}

async function applyOuterGlow(layerName, opts) {
  const c = rgb(opts.color);
  await batchPlay(
    [
      { _obj: "select", _target: [{ _ref: "layer", _name: layerName }], makeVisible: false },
      {
        _obj: "set",
        _target: [{ _ref: "property", _property: "layerEffects" }, { _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
        to: {
          _obj: "layerEffects",
          outerGlow: {
            _obj: "outerGlow",
            enabled: true,
            mode: { _enum: "blendMode", _value: "screen" },
            color: { _obj: "RGBColor", red: c.red, grain: c.green, blue: c.blue },
            opacity: { _unit: "percentUnit", _value: opts.opacity },
            chokeMatte: { _unit: "pixelsUnit", _value: opts.spread || 0 },
            blur: { _unit: "pixelsUnit", _value: opts.size || 10 },
          },
        },
      },
    ],
    {}
  );
}

async function moveActiveLayerIntoGroup(group) {
  if (!group) return;
  const doc = psApp().activeDocument;
  const active = doc.activeLayers[0];
  if (!active) return;
  await active.move(group, "placeInside");
}

module.exports = {
  buildBackground,
  buildOuterFrame,
  buildImageFrame,
  buildDivider,
};

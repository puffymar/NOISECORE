/*
 * Noisecore Dreamlog — layerBuilder.js
 *
 * Builds non-text visual layers: BG, outer frame, image frame, divider.
 * Uses batchPlay for everything Photoshop DOM can't do reliably.
 */

var docMgr = require("./docManager.js");
var constants = require("../utils/constants.js");
var math = require("../utils/math.js");

function batchPlay(desc, opts) {
  return docMgr._action().batchPlay(desc, opts || {});
}

function rgb(hex) {
  return math.hexToRgb(hex);
}

// ---- Background -------------------------------------------------------

async function buildBackground(layout, state) {
  var group = await docMgr.ensureGroup(constants.GROUP_NAMES.bg);
  var bg = state.background;

  // BG Solid
  await makeSolidFill(constants.LAYER_NAMES.bgSolid, bg.solid, 100, "normal");
  await docMgr.moveActiveLayerIntoGroup(group);

  // BG Gradient
  await makeGradient(constants.LAYER_NAMES.bgGradient, bg.gradient, bg.solid, 85);
  await docMgr.moveActiveLayerIntoGroup(group);

  // BG Grain (stub — flat gray, blended)
  await makeSolidFill(constants.LAYER_NAMES.bgGrain, "#808080", bg.grainAmount, bg.grainBlendMode);
  await docMgr.moveActiveLayerIntoGroup(group);

  // BG Vignette
  await makeRadialVignette(constants.LAYER_NAMES.bgVignette, bg.vignetteOpacity);
  await docMgr.moveActiveLayerIntoGroup(group);
}

// ---- Outer Frame ------------------------------------------------------

async function buildOuterFrame(layout, state) {
  var group = await docMgr.ensureGroup(constants.GROUP_NAMES.frame);
  var of = state.outerFrame;
  var f = layout.frame;

  await makeRoundedRect(constants.LAYER_NAMES.outerBorderStroke, {
    x: f.x, y: f.y, w: f.width, h: f.height,
    radius: f.radius,
    strokeColor: of.color,
    strokeWidth: f.thickness,
    hasFill: false,
  });
  await docMgr.moveActiveLayerIntoGroup(group);

  await applyOuterGlow(of.color, of.glowOpacity, of.glowSize, of.glowSpread || 0);
}

// ---- Image Frame (mask + border; image placement in imageBuilder) -----

async function buildImageFrame(layout, state) {
  var group = await docMgr.ensureGroup(constants.GROUP_NAMES.image);
  var img = state.imageFrame;
  var f = layout.imageFrame;

  // Filled mask shape
  await makeRoundedRect(constants.LAYER_NAMES.imageMaskShape, {
    x: f.x, y: f.y, w: f.width, h: f.height,
    radius: f.radius,
    fillColor: state.background.solid,
    hasFill: true,
    strokeColor: null,
    strokeWidth: 0,
  });
  await docMgr.moveActiveLayerIntoGroup(group);

  // Visible border stroke
  await makeRoundedRect(constants.LAYER_NAMES.imageBorder, {
    x: f.x, y: f.y, w: f.width, h: f.height,
    radius: f.radius,
    strokeColor: img.color,
    strokeWidth: f.thickness,
    hasFill: false,
  });
  await docMgr.moveActiveLayerIntoGroup(group);

  await applyOuterGlow(img.color, img.glowOpacity, img.glowSize, 0);
}

// ---- Divider ----------------------------------------------------------

async function buildDivider(layout, state) {
  var group = await docMgr.ensureGroup(constants.GROUP_NAMES.footer);
  var d = layout.divider;

  await makeRoundedRect(constants.LAYER_NAMES.dividerLine, {
    x: d.x, y: d.y, w: d.width, h: d.thickness,
    radius: 0,
    fillColor: state.divider.color,
    hasFill: true,
    strokeColor: null,
    strokeWidth: 0,
  });
  await docMgr.moveActiveLayerIntoGroup(group);

  await applyOuterGlow(state.divider.color, state.divider.glowStrength, 6, 0);
}

// ====================================================================
// Low-level batchPlay helpers
// ====================================================================

async function makeSolidFill(name, hex, opacity, blendMode) {
  var c = rgb(hex);
  var mode = blendMode || "normal";
  await batchPlay([
    {
      _obj: "make",
      _target: [{ _ref: "contentLayer" }],
      using: {
        _obj: "contentLayer",
        type: {
          _obj: "solidColorLayer",
          color: { _obj: "RGBColor", red: c.red, grain: c.green, blue: c.blue },
        },
      },
    },
  ]);
  // Set name, opacity, blend mode on the new layer
  var setDesc = {
    _obj: "set",
    _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
    to: {
      _obj: "layer",
      name: name,
      opacity: { _unit: "percentUnit", _value: opacity || 100 },
    },
  };
  if (mode !== "normal") {
    setDesc.to.mode = { _enum: "blendMode", _value: mode };
  }
  await batchPlay([setDesc]);
}

async function makeGradient(name, topHex, bottomHex, opacity) {
  var a = rgb(topHex);
  var b = rgb(bottomHex);
  await batchPlay([
    {
      _obj: "make",
      _target: [{ _ref: "contentLayer" }],
      using: {
        _obj: "contentLayer",
        type: {
          _obj: "gradientLayer",
          angle: { _unit: "angleUnit", _value: 90 },
          type: { _enum: "gradientType", _value: "linear" },
          gradient: {
            _obj: "gradientClassEvent",
            name: "NC BG",
            gradientForm: { _enum: "gradientForm", _value: "customStops" },
            interfaceIconFrameDimmed: 4096,
            colors: [
              {
                _obj: "colorStop",
                color: { _obj: "RGBColor", red: a.red, grain: a.green, blue: a.blue },
                type: { _enum: "colorStopType", _value: "userStop" },
                location: 0, midpoint: 50,
              },
              {
                _obj: "colorStop",
                color: { _obj: "RGBColor", red: b.red, grain: b.green, blue: b.blue },
                type: { _enum: "colorStopType", _value: "userStop" },
                location: 4096, midpoint: 50,
              },
            ],
            transparency: [
              { _obj: "transferSpec", opacity: { _unit: "percentUnit", _value: 100 }, location: 0, midpoint: 50 },
              { _obj: "transferSpec", opacity: { _unit: "percentUnit", _value: 100 }, location: 4096, midpoint: 50 },
            ],
          },
        },
      },
    },
  ]);
  await batchPlay([
    {
      _obj: "set",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      to: { _obj: "layer", name: name, opacity: { _unit: "percentUnit", _value: opacity } },
    },
  ]);
}

async function makeRadialVignette(name, opacity) {
  await batchPlay([
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
            name: "NC Vignette",
            gradientForm: { _enum: "gradientForm", _value: "customStops" },
            interfaceIconFrameDimmed: 4096,
            colors: [
              {
                _obj: "colorStop",
                color: { _obj: "RGBColor", red: 0, grain: 0, blue: 0 },
                type: { _enum: "colorStopType", _value: "userStop" },
                location: 0, midpoint: 50,
              },
              {
                _obj: "colorStop",
                color: { _obj: "RGBColor", red: 0, grain: 0, blue: 0 },
                type: { _enum: "colorStopType", _value: "userStop" },
                location: 4096, midpoint: 50,
              },
            ],
            transparency: [
              { _obj: "transferSpec", opacity: { _unit: "percentUnit", _value: 0 }, location: 0, midpoint: 50 },
              { _obj: "transferSpec", opacity: { _unit: "percentUnit", _value: 100 }, location: 4096, midpoint: 50 },
            ],
          },
        },
      },
    },
  ]);
  await batchPlay([
    {
      _obj: "set",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      to: { _obj: "layer", name: name, opacity: { _unit: "percentUnit", _value: opacity } },
    },
  ]);
}

async function makeRoundedRect(name, opts) {
  var hasFill = opts.hasFill;
  var fillC = hasFill && opts.fillColor ? rgb(opts.fillColor) : { red: 0, green: 0, blue: 0 };
  var hasStroke = opts.strokeColor && opts.strokeWidth > 0;

  var desc = {
    _obj: "make",
    _target: [{ _ref: "contentLayer" }],
    using: {
      _obj: "contentLayer",
      type: {
        _obj: "solidColorLayer",
        color: {
          _obj: "RGBColor",
          red: hasFill ? fillC.red : 0,
          grain: hasFill ? fillC.green : 0,
          blue: hasFill ? fillC.blue : 0,
        },
      },
      shape: {
        _obj: "rectangle",
        unitValueQuadVersion: 1,
        top:    { _unit: "pixelsUnit", _value: opts.y },
        left:   { _unit: "pixelsUnit", _value: opts.x },
        bottom: { _unit: "pixelsUnit", _value: opts.y + opts.h },
        right:  { _unit: "pixelsUnit", _value: opts.x + opts.w },
        topRight:    { _unit: "pixelsUnit", _value: opts.radius },
        topLeft:     { _unit: "pixelsUnit", _value: opts.radius },
        bottomLeft:  { _unit: "pixelsUnit", _value: opts.radius },
        bottomRight: { _unit: "pixelsUnit", _value: opts.radius },
      },
    },
  };

  if (hasStroke) {
    var sc = rgb(opts.strokeColor);
    desc.using.strokeStyle = {
      _obj: "strokeStyle",
      strokeStyleVersion: 2,
      strokeEnabled: true,
      fillEnabled: hasFill,
      strokeStyleLineWidth: { _unit: "pixelsUnit", _value: opts.strokeWidth },
      strokeStyleLineAlignment: { _enum: "strokeStyleLineAlignment", _value: "strokeStyleAlignCenter" },
      strokeStyleContent: {
        _obj: "solidColorLayer",
        color: { _obj: "RGBColor", red: sc.red, grain: sc.green, blue: sc.blue },
      },
      strokeStyleOpacity: { _unit: "percentUnit", _value: 100 },
    };
  }

  if (!hasFill && !hasStroke) {
    // Just make a filled shape with the fill color
    desc.using.type.color = {
      _obj: "RGBColor",
      red: fillC.red, grain: fillC.green, blue: fillC.blue,
    };
  }

  await batchPlay([desc]);
  // Rename
  await batchPlay([
    {
      _obj: "set",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      to: { _obj: "layer", name: name },
    },
  ]);
}

async function applyOuterGlow(hex, opacity, size, spread) {
  var c = rgb(hex);
  await batchPlay([
    {
      _obj: "set",
      _target: [
        { _ref: "property", _property: "layerEffects" },
        { _ref: "layer", _enum: "ordinal", _value: "targetEnum" },
      ],
      to: {
        _obj: "layerEffects",
        outerGlow: {
          _obj: "outerGlow",
          enabled: true,
          mode: { _enum: "blendMode", _value: "screen" },
          color: { _obj: "RGBColor", red: c.red, grain: c.green, blue: c.blue },
          opacity: { _unit: "percentUnit", _value: opacity || 50 },
          chokeMatte: { _unit: "pixelsUnit", _value: spread || 0 },
          blur: { _unit: "pixelsUnit", _value: size || 10 },
        },
      },
    },
  ]);
}

module.exports = {
  buildBackground,
  buildOuterFrame,
  buildImageFrame,
  buildDivider,
};

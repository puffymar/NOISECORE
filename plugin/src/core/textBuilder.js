/*
 * Noisecore Dreamlog — textBuilder.js
 *
 * Creates title, body paragraph, and footer text layers.
 */

var docMgr = require("./docManager.js");
var constants = require("../utils/constants.js");
var math = require("../utils/math.js");

function batchPlay(desc, opts) {
  return docMgr._action().batchPlay(desc, opts || {});
}

function rgb(hex) { return math.hexToRgb(hex); }

async function buildTitle(layout, state) {
  var group = await docMgr.ensureGroup(constants.GROUP_NAMES.title);
  var t = layout.title;
  var text = t.text || "TITLE";

  await makeTextLayer(constants.LAYER_NAMES.titleText, text, {
    x: t.x,
    y: t.y,
    fontSize: t.fontSize,
    tracking: t.tracking,
    leading: t.leading,
    color: state.title.color,
    font: constants.FONTS.titleStack[0],
    justification: "center",
  });
  await docMgr.moveActiveLayerIntoGroup(group);

  if (state.title.glowEnabled) {
    await applyTextGlow(state.title.color, state.title.glowStrength);
  }
}

async function buildBody(layout, state) {
  var group = await docMgr.ensureGroup(constants.GROUP_NAMES.body);
  var b = layout.body;
  var text = state.body.text || "Body text";

  await makeTextLayer(constants.LAYER_NAMES.paragraphText, text, {
    x: b.x,
    y: b.y,
    fontSize: b.fontSize,
    tracking: b.tracking,
    leading: b.leading,
    color: state.body.color,
    font: constants.FONTS.bodyStack[0],
    justification: "left",
    boxWidth: b.width,
    boxHeight: layout.divider.y - b.y - 10,
  });
  await docMgr.moveActiveLayerIntoGroup(group);
}

async function buildFooter(layout, state) {
  var group = await docMgr.ensureGroup(constants.GROUP_NAMES.footer);
  var f = layout.footer;
  var font = constants.FONTS.footerStack[0];

  var leftText  = state.footer.uppercase ? state.footer.leftText.toUpperCase()  : state.footer.leftText;
  var slashText = state.footer.slashText;
  var rightText = state.footer.uppercase ? state.footer.rightText.toUpperCase() : state.footer.rightText;
  var fullText = leftText + "  " + slashText + "  " + rightText;

  // Create a single centered footer text layer with color ranges
  await makeTextLayer(constants.LAYER_NAMES.footerLeft, fullText, {
    x: f.centerX,
    y: f.y,
    fontSize: f.fontSize,
    tracking: f.tracking,
    color: state.footer.colorLeft,
    font: font,
    justification: "center",
  });
  await docMgr.moveActiveLayerIntoGroup(group);
}

// ---- Core text layer creation via batchPlay ---------------------------

async function makeTextLayer(name, text, opts) {
  var c = rgb(opts.color);
  var just = opts.justification === "center" ? "center"
           : opts.justification === "right"  ? "right"
           : "left";

  var textStyle = {
    _obj: "textStyle",
    fontPostScriptName: opts.font,
    size: { _unit: "pointsUnit", _value: opts.fontSize },
    tracking: opts.tracking || 0,
    color: { _obj: "RGBColor", red: c.red, grain: c.green, blue: c.blue },
    antiAlias: { _enum: "antiAliasType", _value: "antiAliasSmooth" },
  };
  if (opts.leading) {
    textStyle.autoLeading = false;
    textStyle.leading = { _unit: "pointsUnit", _value: opts.leading };
  }

  var paragraphStyle = {
    _obj: "paragraphStyle",
    align: { _enum: "alignmentType", _value: just },
  };

  var textDesc = {
    _obj: "textLayer",
    textKey: text,
    textClickPoint: {
      _obj: "paint",
      horizontal: { _unit: "percentUnit", _value: (opts.x / 1080) * 100 },
      vertical:   { _unit: "percentUnit", _value: (opts.y / 1350) * 100 },
    },
    textStyleRange: [
      {
        _obj: "textStyleRange",
        from: 0,
        to: text.length,
        textStyle: textStyle,
      },
    ],
    paragraphStyleRange: [
      {
        _obj: "paragraphStyleRange",
        from: 0,
        to: text.length,
        paragraphStyle: paragraphStyle,
      },
    ],
  };

  // Use a text box for body text so it auto-wraps
  if (opts.boxWidth && opts.boxHeight) {
    textDesc.textShape = [
      {
        _obj: "textShape",
        char: { _enum: "char", _value: "box" },
        bounds: {
          _obj: "rectangle",
          top:    { _unit: "pixelsUnit", _value: opts.y },
          left:   { _unit: "pixelsUnit", _value: opts.x },
          bottom: { _unit: "pixelsUnit", _value: opts.y + opts.boxHeight },
          right:  { _unit: "pixelsUnit", _value: opts.x + opts.boxWidth },
        },
        orientation: { _enum: "orientation", _value: "horizontal" },
      },
    ];
    // Remove click point for box text
    delete textDesc.textClickPoint;
  }

  await batchPlay([
    {
      _obj: "make",
      _target: [{ _ref: "textLayer" }],
      using: textDesc,
    },
  ]);

  // Rename layer
  await batchPlay([
    {
      _obj: "set",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      to: { _obj: "layer", name: name },
    },
  ]);
}

async function applyTextGlow(hex, strength) {
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
          opacity: { _unit: "percentUnit", _value: strength || 40 },
          blur: { _unit: "pixelsUnit", _value: 18 },
        },
      },
    },
  ]);
}

module.exports = { buildTitle, buildBody, buildFooter };

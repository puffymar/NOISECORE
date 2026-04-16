/*
 * Noisecore Dreamlog — textBuilder.js
 *
 * Creates the title, body, and three footer text layers. Uses the
 * UXP DOM API (doc.createTextLayer) and then patches font/size/color
 * via the textItem descriptor.
 */

const { _app: psApp, _action: psAction, ensureGroup } = require("./docManager.js");
const { LAYER_NAMES, GROUP_NAMES, FONTS } = require("../utils/constants.js");
const { hexToRgb } = require("../utils/math.js");

const batchPlay = (...args) => psAction().batchPlay(...args);

async function buildTitle(layout, state) {
  const group = await ensureGroup(GROUP_NAMES.title);
  const t = layout.title;
  const font = pickFont(FONTS.titleStack);

  const layer = await createTextLayer({
    name: LAYER_NAMES.titleText,
    text: t.text,
    x: t.x,
    y: t.y + t.fontSize, // Photoshop anchors text at baseline
    fontSize: t.fontSize,
    tracking: t.tracking,
    leading: t.leading,
    color: state.title.color,
    font,
    justification: "center",
  });
  await layer.move(group, "placeInside");

  if (state.title.glowEnabled) {
    await applyTextGlow(LAYER_NAMES.titleText, state.title.color, state.title.glowStrength);
  }
}

async function buildBody(layout, state) {
  const group = await ensureGroup(GROUP_NAMES.body);
  const b = layout.body;
  const font = pickFont(FONTS.bodyStack);

  const layer = await createTextLayer({
    name: LAYER_NAMES.paragraphText,
    text: state.body.text,
    x: b.x,
    y: b.y + b.fontSize,
    fontSize: b.fontSize,
    tracking: b.tracking,
    leading: b.leading,
    color: state.body.color,
    font,
    justification: "left",
    paragraphWidth: b.width,
  });
  await layer.move(group, "placeInside");
}

async function buildFooter(layout, state) {
  const group = await ensureGroup(GROUP_NAMES.footer);
  const f = layout.footer;
  const font = pickFont(FONTS.footerStack);

  const leftText  = state.footer.uppercase ? state.footer.leftText.toUpperCase()  : state.footer.leftText;
  const slashText = state.footer.slashText;
  const rightText = state.footer.uppercase ? state.footer.rightText.toUpperCase() : state.footer.rightText;

  // We don't know the exact rendered widths without measuring, so we
  // lay the three pieces out around the center using a rough em-width
  // estimate. The layers remain independent and live-editable.
  const charW = f.fontSize * 0.55;
  const spacing = f.spacing;
  const leftW  = leftText.length  * charW;
  const slashW = slashText.length * charW;
  const rightW = rightText.length * charW;
  const total  = leftW + slashW + rightW + spacing * 2;
  const startX = f.centerX - total / 2;

  const leftLayer = await createTextLayer({
    name: LAYER_NAMES.footerLeft,
    text: leftText,
    x: startX,
    y: f.y + f.fontSize,
    fontSize: f.fontSize,
    tracking: f.tracking,
    color: state.footer.colorLeft,
    font,
    justification: "left",
  });
  await leftLayer.move(group, "placeInside");

  const slashLayer = await createTextLayer({
    name: LAYER_NAMES.footerSlash,
    text: slashText,
    x: startX + leftW + spacing,
    y: f.y + f.fontSize,
    fontSize: f.fontSize,
    tracking: f.tracking,
    color: state.footer.colorSlash,
    font,
    justification: "left",
  });
  await slashLayer.move(group, "placeInside");

  const rightLayer = await createTextLayer({
    name: LAYER_NAMES.footerRight,
    text: rightText,
    x: startX + leftW + spacing + slashW + spacing,
    y: f.y + f.fontSize,
    fontSize: f.fontSize,
    tracking: f.tracking,
    color: state.footer.colorRight,
    font,
    justification: "left",
  });
  await rightLayer.move(group, "placeInside");
}

// --------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------

function pickFont(stack) {
  // UXP has no reliable synchronous font enumeration, so we return the
  // first candidate and Photoshop substitutes if unavailable. Missing
  // fonts are logged but not fatal.
  return stack[0];
}

async function createTextLayer({ name, text, x, y, fontSize, tracking, leading, color, font, justification, paragraphWidth }) {
  const doc = psApp().activeDocument;
  const layer = await doc.createTextLayer({ name, contents: text });

  const c = hexToRgb(color);
  const just = justificationEnum(justification);

  // Position by moving the layer to (x, y). The DOM move function uses
  // (dx, dy) deltas from the current position, so we translate from the
  // layer's current bounds center.
  const b = layer.bounds;
  const dx = x - b.left;
  const dy = y - b.top;
  await layer.translate(dx, dy);

  // Apply textItem descriptor for font, size, color, tracking, leading.
  await batchPlay(
    [
      {
        _obj: "set",
        _target: [{ _ref: "textLayer", _enum: "ordinal", _value: "targetEnum" }],
        to: {
          _obj: "textLayer",
          textStyleRange: [
            {
              _obj: "textStyleRange",
              from: 0,
              to: text.length,
              textStyle: {
                _obj: "textStyle",
                fontPostScriptName: font,
                fontName: font,
                size: { _unit: "pointsUnit", _value: fontSize },
                tracking: tracking || 0,
                color: { _obj: "RGBColor", red: c.red, grain: c.green, blue: c.blue },
                autoLeading: leading ? false : true,
                leading: leading ? { _unit: "pointsUnit", _value: leading } : undefined,
              },
            },
          ],
          paragraphStyleRange: [
            {
              _obj: "paragraphStyleRange",
              from: 0,
              to: text.length,
              paragraphStyle: {
                _obj: "paragraphStyle",
                align: { _enum: "alignmentType", _value: just },
              },
            },
          ],
        },
      },
    ],
    {}
  );

  return layer;
}

function justificationEnum(j) {
  switch (j) {
    case "center": return "center";
    case "right":  return "right";
    case "left":
    default:       return "left";
  }
}

async function applyTextGlow(layerName, color, strength) {
  const c = hexToRgb(color);
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
            opacity: { _unit: "percentUnit", _value: strength || 40 },
            blur: { _unit: "pixelsUnit", _value: 18 },
          },
        },
      },
    ],
    {}
  );
}

module.exports = { buildTitle, buildBody, buildFooter };

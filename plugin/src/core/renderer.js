/*
 * Noisecore Dreamlog — renderer.js
 *
 * Strict staged renderer. Two-pass: structure first, style second.
 * Every step logs what it did, validates the result, and stops on failure.
 * Debug mode uses loud colors. Safe mode skips all FX.
 */

var log = require("./logger.js");
var constants = require("../utils/constants.js");
var math = require("../utils/math.js");

function ps() { return require("photoshop"); }
function app() { return ps().app; }
function action() { return ps().action; }

function batchPlay(desc) {
  return action().batchPlay(desc, {});
}

var DEBUG_COLORS = {
  background:   "#2A0006",
  outerBorder:  "#00F0FF",
  title:        "#FFD400",
  imagePlaceholder: "#FF00AA",
  bodyText:     "#6CFF6C",
  divider:      "#FFFFFF",
  footerLeft:   "#FF6A00",
  footerSlash:  "#FFFFFF",
  footerRight:  "#6AE6FF",
};

var HARDCODED = {
  width: 1080, height: 1350,
  frame:    { x: 50, y: 50, w: 980, h: 1250, radius: 38, stroke: 5 },
  title:    { y: 78, centerX: 540 },
  image:    { x: 110, y: 170, w: 860, h: 470, radius: 26, stroke: 4 },
  body:     { x: 92, y: 680, w: 896, h: 390 },
  divider:  { x: 95, y: 1180, w: 850, h: 3 },
  footer:   { centerX: 540, y: 1235 },
};

var TEST_CONTENT = {
  title: "COPYCAT",
  paragraph: "She sometimes can be a bit self conscious, but lately she's been realizing that she's one of the ones. She's good and she's getting better. She's starting to get into her groove, and her fans are feeling her confidence as she progresses through the scene. We'll be here and continue to see what Tiffany Day accomplishes going further into her career. Or if she'll decide to sign the contract she's scared of.",
  footerLeft: "NOISECORE",
  footerSlash: "//",
  footerRight: "DREAMLOG",
  imagePlaceholder: "IMAGE",
};

function rgb(hex) {
  return math.hexToRgb(hex);
}

function getColor(debugMode, debugKey, normalHex) {
  return debugMode ? DEBUG_COLORS[debugKey] : normalHex;
}

// ====================================================================
// Group management
// ====================================================================

function findGroupByName(doc, name) {
  for (var i = 0; i < doc.layers.length; i++) {
    var layer = doc.layers[i];
    if (layer.name === name && layer.layers !== undefined) return layer;
  }
  return null;
}

async function createGroupsInOrder(doc) {
  var names = [
    constants.GROUP_NAMES.bg,
    constants.GROUP_NAMES.frame,
    constants.GROUP_NAMES.title,
    constants.GROUP_NAMES.image,
    constants.GROUP_NAMES.body,
    constants.GROUP_NAMES.footer,
    constants.GROUP_NAMES.globalFx,
  ];
  var groups = {};
  for (var i = 0; i < names.length; i++) {
    var existing = findGroupByName(doc, names[i]);
    if (existing) {
      groups[names[i]] = existing;
    } else {
      groups[names[i]] = await doc.createLayerGroup({ name: names[i] });
    }
  }
  return groups;
}

async function moveIntoGroup(group) {
  if (!group || !group.id) {
    log.warn("moveIntoGroup: no valid group (id=" + (group ? group.id : "null") + ")");
    return false;
  }
  await batchPlay([
    {
      _obj: "move",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      to: { _ref: "layer", _id: group.id },
      adjustment: false,
      version: 5,
    },
  ]);
  return true;
}

function getActiveLayerBounds(doc) {
  var layer = doc.activeLayers[0];
  if (!layer) return null;
  var b = layer.bounds;
  return {
    x: b.left,
    y: b.top,
    w: b.right - b.left,
    h: b.bottom - b.top,
  };
}

// ====================================================================
// Atomic layer creation primitives
// ====================================================================

async function makeSolidFillLayer(name, hex, opacity) {
  var c = rgb(hex);
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
  await batchPlay([
    {
      _obj: "set",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      to: {
        _obj: "layer",
        name: name,
        opacity: { _unit: "percentUnit", _value: opacity != null ? opacity : 100 },
      },
    },
  ]);
}

async function makeRoundedRectStroke(name, x, y, w, h, radius, strokeWidth, strokeHex) {
  var sc = rgb(strokeHex);
  await batchPlay([
    {
      _obj: "make",
      _target: [{ _ref: "contentLayer" }],
      using: {
        _obj: "contentLayer",
        type: {
          _obj: "solidColorLayer",
          color: { _obj: "RGBColor", red: 0, grain: 0, blue: 0 },
        },
        shape: {
          _obj: "rectangle",
          unitValueQuadVersion: 1,
          top:    { _unit: "pixelsUnit", _value: y },
          left:   { _unit: "pixelsUnit", _value: x },
          bottom: { _unit: "pixelsUnit", _value: y + h },
          right:  { _unit: "pixelsUnit", _value: x + w },
          topRight:    { _unit: "pixelsUnit", _value: radius },
          topLeft:     { _unit: "pixelsUnit", _value: radius },
          bottomLeft:  { _unit: "pixelsUnit", _value: radius },
          bottomRight: { _unit: "pixelsUnit", _value: radius },
        },
        strokeStyle: {
          _obj: "strokeStyle",
          strokeStyleVersion: 2,
          strokeEnabled: true,
          fillEnabled: false,
          strokeStyleLineWidth: { _unit: "pixelsUnit", _value: strokeWidth },
          strokeStyleLineAlignment: { _enum: "strokeStyleLineAlignment", _value: "strokeStyleAlignCenter" },
          strokeStyleContent: {
            _obj: "solidColorLayer",
            color: { _obj: "RGBColor", red: sc.red, grain: sc.green, blue: sc.blue },
          },
          strokeStyleOpacity: { _unit: "percentUnit", _value: 100 },
        },
      },
    },
  ]);
  await batchPlay([
    {
      _obj: "set",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      to: { _obj: "layer", name: name },
    },
  ]);
}

async function makeRoundedRectFill(name, x, y, w, h, radius, fillHex, opacity) {
  var fc = rgb(fillHex);
  await batchPlay([
    {
      _obj: "make",
      _target: [{ _ref: "contentLayer" }],
      using: {
        _obj: "contentLayer",
        type: {
          _obj: "solidColorLayer",
          color: { _obj: "RGBColor", red: fc.red, grain: fc.green, blue: fc.blue },
        },
        shape: {
          _obj: "rectangle",
          unitValueQuadVersion: 1,
          top:    { _unit: "pixelsUnit", _value: y },
          left:   { _unit: "pixelsUnit", _value: x },
          bottom: { _unit: "pixelsUnit", _value: y + h },
          right:  { _unit: "pixelsUnit", _value: x + w },
          topRight:    { _unit: "pixelsUnit", _value: radius },
          topLeft:     { _unit: "pixelsUnit", _value: radius },
          bottomLeft:  { _unit: "pixelsUnit", _value: radius },
          bottomRight: { _unit: "pixelsUnit", _value: radius },
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
    },
  };
  if (opacity != null && opacity < 100) {
    setDesc.to.opacity = { _unit: "percentUnit", _value: opacity };
  }
  await batchPlay([setDesc]);
}

async function makePointText(name, text, x, y, fontSize, fontName, colorHex, justification) {
  var c = rgb(colorHex);
  var just = justification === "center" ? "center" : justification === "right" ? "right" : "left";

  log.info("makePointText: '" + text.substring(0, 20) + "' at px(" + x + "," + y + ") size=" + fontSize + " font=" + fontName + " color=" + colorHex);

  // Step 1: Create bare text layer with just the text content
  try {
    await batchPlay([
      {
        _obj: "make",
        _target: [{ _ref: "textLayer" }],
        using: {
          _obj: "textLayer",
          textKey: text,
          textClickPoint: {
            _obj: "paint",
            horizontal: { _unit: "pixelsUnit", _value: x },
            vertical:   { _unit: "pixelsUnit", _value: y },
          },
        },
      },
    ]);
    log.info("  text layer created");
  } catch (e) {
    log.fail("makePointText create", e);
    throw e;
  }

  // Step 2: Apply text styling via set
  try {
    await batchPlay([
      {
        _obj: "set",
        _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
        to: {
          _obj: "textLayer",
          textStyleRange: [
            {
              _obj: "textStyleRange",
              from: 0,
              to: text.length,
              textStyle: {
                _obj: "textStyle",
                fontPostScriptName: fontName,
                size: { _unit: "pointsUnit", _value: fontSize },
                color: { _obj: "RGBColor", red: c.red, grain: c.green, blue: c.blue },
                antiAlias: { _enum: "antiAliasType", _value: "antiAliasSmooth" },
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
    ]);
    log.info("  text style applied");
  } catch (e) {
    log.warn("makePointText style failed (text still visible): " + e.message);
  }

  // Step 3: Rename
  await batchPlay([
    {
      _obj: "set",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      to: { _obj: "layer", name: name },
    },
  ]);
}

async function makeBoxText(name, text, x, y, w, h, fontSize, leading, fontName, colorHex) {
  var c = rgb(colorHex);

  log.info("makeBoxText: " + text.length + " chars at box(" + x + "," + y + "," + w + "," + h + ") size=" + fontSize + " font=" + fontName);

  // Step 1: Create text layer with box shape
  try {
    await batchPlay([
      {
        _obj: "make",
        _target: [{ _ref: "textLayer" }],
        using: {
          _obj: "textLayer",
          textKey: text,
          textShape: [
            {
              _obj: "textShape",
              char: { _enum: "char", _value: "box" },
              bounds: {
                _obj: "rectangle",
                top:    { _unit: "pixelsUnit", _value: y },
                left:   { _unit: "pixelsUnit", _value: x },
                bottom: { _unit: "pixelsUnit", _value: y + h },
                right:  { _unit: "pixelsUnit", _value: x + w },
              },
              orientation: { _enum: "orientation", _value: "horizontal" },
            },
          ],
        },
      },
    ]);
    log.info("  box text layer created");
  } catch (e) {
    log.fail("makeBoxText create", e);
    throw e;
  }

  // Step 2: Apply text styling
  try {
    await batchPlay([
      {
        _obj: "set",
        _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
        to: {
          _obj: "textLayer",
          textStyleRange: [
            {
              _obj: "textStyleRange",
              from: 0,
              to: text.length,
              textStyle: {
                _obj: "textStyle",
                fontPostScriptName: fontName,
                size: { _unit: "pointsUnit", _value: fontSize },
                autoLeading: false,
                leading: { _unit: "pointsUnit", _value: leading },
                color: { _obj: "RGBColor", red: c.red, grain: c.green, blue: c.blue },
                antiAlias: { _enum: "antiAliasType", _value: "antiAliasSmooth" },
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
                align: { _enum: "alignmentType", _value: "left" },
              },
            },
          ],
        },
      },
    ]);
    log.info("  box text style applied");
  } catch (e) {
    log.warn("makeBoxText style failed (text still visible): " + e.message);
  }

  // Step 3: Rename
  await batchPlay([
    {
      _obj: "set",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      to: { _obj: "layer", name: name },
    },
  ]);
}

async function applyOuterGlow(hex, opacity, size) {
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
          blur: { _unit: "pixelsUnit", _value: size || 10 },
        },
      },
    },
  ]);
}

// ====================================================================
// STAGE FUNCTIONS — Structure pass (Pass 1)
// ====================================================================

async function renderBackground(doc, groups, state, debugMode) {
  log.stage("renderBackground");
  var bgColor = getColor(debugMode, "background", state.background.solid);
  await makeSolidFillLayer(constants.LAYER_NAMES.bgSolid, bgColor, 100);
  await moveIntoGroup(groups[constants.GROUP_NAMES.bg]);
  var bounds = getActiveLayerBounds(doc);
  log.ok("BG Solid " + log.boundsStr(bounds));
  return true;
}

async function renderOuterFrame(doc, groups, state, debugMode) {
  log.stage("renderOuterFrame");
  var f = HARDCODED.frame;
  var strokeColor = getColor(debugMode, "outerBorder", state.outerFrame.color);
  await makeRoundedRectStroke(
    constants.LAYER_NAMES.outerBorderStroke,
    f.x, f.y, f.w, f.h, f.radius, f.stroke, strokeColor
  );
  await moveIntoGroup(groups[constants.GROUP_NAMES.frame]);
  var bounds = getActiveLayerBounds(doc);
  log.ok("Outer frame at " + log.boundsStr(bounds));
  return true;
}

async function renderTitle(doc, groups, state, debugMode) {
  log.stage("renderTitle");
  var titleText = state.title.text || "UNTITLED";
  if (state.title.uppercase) titleText = titleText.toUpperCase();
  var titleColor = getColor(debugMode, "title", state.title.color);
  var font = constants.FONTS.titleStack[0];
  log.info("Title font: " + font + ", text: " + titleText.substring(0, 30));

  await makePointText(
    constants.LAYER_NAMES.titleText,
    titleText,
    HARDCODED.title.centerX,
    HARDCODED.title.y,
    state.title.fontSize || 84,
    font,
    titleColor,
    "center"
  );
  await moveIntoGroup(groups[constants.GROUP_NAMES.title]);
  var bounds = getActiveLayerBounds(doc);
  log.ok("Title at " + log.boundsStr(bounds));
  return true;
}

async function renderImageSection(doc, groups, state, debugMode) {
  log.stage("renderImageSection");
  var im = HARDCODED.image;

  var placeholderColor = getColor(debugMode, "imagePlaceholder", "#1A0507");
  await makeRoundedRectFill(
    constants.LAYER_NAMES.imageMaskShape,
    im.x, im.y, im.w, im.h, im.radius, placeholderColor, 100
  );
  await moveIntoGroup(groups[constants.GROUP_NAMES.image]);
  log.ok("Image placeholder at x=" + im.x + " y=" + im.y + " w=" + im.w + " h=" + im.h);

  var borderColor = getColor(debugMode, "outerBorder", state.imageFrame.color || "#FF5A2A");
  await makeRoundedRectStroke(
    constants.LAYER_NAMES.imageBorder,
    im.x, im.y, im.w, im.h, im.radius, im.stroke, borderColor
  );
  await moveIntoGroup(groups[constants.GROUP_NAMES.image]);
  log.ok("Image border stroke");

  if (state.image && state.image.token) {
    log.info("Image token found, placing image...");
    try {
      await placeImage(doc, groups, state);
    } catch (e) {
      log.warn("Image placement failed, keeping placeholder: " + e.message);
      await makePointText(
        "Image Missing Label",
        "IMAGE MISSING",
        im.x + im.w / 2,
        im.y + im.h / 2 - 20,
        36,
        "ArialMT",
        debugMode ? "#FFFFFF" : "#5A1020",
        "center"
      );
      await moveIntoGroup(groups[constants.GROUP_NAMES.image]);
    }
  } else {
    await makePointText(
      "Image Placeholder Label",
      "IMAGE",
      im.x + im.w / 2,
      im.y + im.h / 2 - 20,
      48,
      "ArialMT",
      debugMode ? "#FFFFFF" : "#3A1020",
      "center"
    );
    await moveIntoGroup(groups[constants.GROUP_NAMES.image]);
    log.ok("No image selected, placeholder rendered");
  }
  return true;
}

async function placeImage(doc, groups, state) {
  var im = HARDCODED.image;
  await batchPlay([
    {
      _obj: "placeEvent",
      null: { _path: state.image.token, _kind: "local" },
      freeTransformCenterState: { _enum: "quadCenterState", _value: "QCSAverage" },
      offset: {
        _obj: "offset",
        horizontal: { _unit: "pixelsUnit", _value: 0 },
        vertical: { _unit: "pixelsUnit", _value: 0 },
      },
    },
  ]);
  await batchPlay([
    {
      _obj: "set",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      to: { _obj: "layer", name: constants.LAYER_NAMES.placedImage },
    },
  ]);

  var placed = doc.activeLayers[0];
  if (!placed) throw new Error("No active layer after placeEvent");

  var b = placed.bounds;
  var sw = b.right - b.left;
  var sh = b.bottom - b.top;
  if (sw <= 0 || sh <= 0) throw new Error("Placed image has zero size");

  var fit = math.fitImage(sw, sh, im.w, im.h, state.imageFrame.fitMode || "cover");
  var scaleX = (fit.w / sw) * 100;
  var scaleY = (fit.h / sh) * 100;

  await batchPlay([
    {
      _obj: "transform",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      freeTransformCenterState: { _enum: "quadCenterState", _value: "QCSIndependent" },
      position: {
        _obj: "position",
        horizontal: { _unit: "pixelsUnit", _value: im.x + fit.x },
        vertical:   { _unit: "pixelsUnit", _value: im.y + fit.y },
      },
      width:  { _unit: "percentUnit", _value: scaleX * (state.imageFrame.scale || 1) },
      height: { _unit: "percentUnit", _value: scaleY * (state.imageFrame.scale || 1) },
      interfaceIconFrameDimmed: { _enum: "interpolationType", _value: "bicubicSharper" },
    },
  ]);

  await moveIntoGroup(groups[constants.GROUP_NAMES.image]);
  log.ok("Image placed and fitted");
}

async function renderBodyText(doc, groups, state, debugMode) {
  log.stage("renderBodyText");
  var bd = HARDCODED.body;
  var bodyText = (state.body && state.body.text) ? state.body.text : "No paragraph text provided.";
  var bodyColor = getColor(debugMode, "bodyText", state.body.color || "#E86A38");
  var font = constants.FONTS.bodyStack[0];
  log.info("Body font: " + font + ", length: " + bodyText.length + " chars");

  await makeBoxText(
    constants.LAYER_NAMES.paragraphText,
    bodyText,
    bd.x, bd.y, bd.w, bd.h,
    state.body.fontSize || 31,
    state.body.leading || 42,
    font,
    bodyColor
  );
  await moveIntoGroup(groups[constants.GROUP_NAMES.body]);
  var bounds = getActiveLayerBounds(doc);
  log.ok("Body text at " + log.boundsStr(bounds));
  return true;
}

async function renderDivider(doc, groups, state, debugMode) {
  log.stage("renderDivider");
  var d = HARDCODED.divider;
  var divColor = getColor(debugMode, "divider", state.divider.color || "#E14E26");

  await makeRoundedRectFill(
    constants.LAYER_NAMES.dividerLine,
    d.x, d.y, d.w, d.h, 0, divColor, 100
  );
  await moveIntoGroup(groups[constants.GROUP_NAMES.footer]);
  log.ok("Divider at y=" + d.y + " w=" + d.w);
  return true;
}

async function renderFooter(doc, groups, state, debugMode) {
  log.stage("renderFooter");
  var ft = HARDCODED.footer;

  var leftText  = state.footer.leftText  || "NOISECORE";
  var slashText = state.footer.slashText || "//";
  var rightText = state.footer.rightText || "DREAMLOG";
  if (state.footer.uppercase) {
    leftText  = leftText.toUpperCase();
    rightText = rightText.toUpperCase();
  }

  var fullText = leftText + "  " + slashText + "  " + rightText;
  var footerColor = getColor(debugMode, "footerLeft", state.footer.colorLeft || "#F2552C");
  var font = constants.FONTS.footerStack[0];
  log.info("Footer font: " + font + ", text: " + fullText);

  await makePointText(
    constants.LAYER_NAMES.footerLeft,
    fullText,
    ft.centerX,
    ft.y,
    state.footer.fontSize || 38,
    font,
    footerColor,
    "center"
  );
  await moveIntoGroup(groups[constants.GROUP_NAMES.footer]);
  var bounds = getActiveLayerBounds(doc);
  log.ok("Footer at " + log.boundsStr(bounds));
  return true;
}

// ====================================================================
// STAGE FUNCTIONS — Style pass (Pass 2)
// ====================================================================

async function applyFX(doc, groups, state, debugMode) {
  log.stage("applyFX (style pass)");

  try {
    await selectLayerByName(constants.LAYER_NAMES.outerBorderStroke);
    await applyOuterGlow(
      state.outerFrame.color || "#FF5A2A",
      state.outerFrame.glowOpacity || 72,
      state.outerFrame.glowSize || 24
    );
    log.ok("Outer frame glow applied");
  } catch (e) {
    log.warn("Outer frame glow failed: " + e.message);
  }

  try {
    await selectLayerByName(constants.LAYER_NAMES.imageBorder);
    await applyOuterGlow(
      state.imageFrame.color || "#FF5A2A",
      state.imageFrame.glowOpacity || 55,
      state.imageFrame.glowSize || 16
    );
    log.ok("Image border glow applied");
  } catch (e) {
    log.warn("Image border glow failed: " + e.message);
  }

  if (state.title.glowEnabled) {
    try {
      await selectLayerByName(constants.LAYER_NAMES.titleText);
      await applyOuterGlow(
        state.title.color || "#F2552C",
        state.title.glowStrength || 40,
        18
      );
      log.ok("Title glow applied");
    } catch (e) {
      log.warn("Title glow failed: " + e.message);
    }
  }

  try {
    await selectLayerByName(constants.LAYER_NAMES.dividerLine);
    await applyOuterGlow(
      state.divider.color || "#E14E26",
      state.divider.glowStrength || 30,
      6
    );
    log.ok("Divider glow applied");
  } catch (e) {
    log.warn("Divider glow failed: " + e.message);
  }

  if (state.crt && state.crt.enabled) {
    log.info("CRT enabled, adding overlays to Image group");
    try {
      await makeFxLayer(constants.LAYER_NAMES.crtOverlay, state.crt.scanlineOpacity || 14, "multiply", 20, 20, 20);
      await moveIntoGroup(groups[constants.GROUP_NAMES.image]);
      log.ok("CRT overlay");
    } catch (e) { log.warn("CRT overlay failed: " + e.message); }

    try {
      await makeFxLayer(constants.LAYER_NAMES.filmGrainOverlay, state.crt.filmGrain || 18, "softLight", 128, 128, 128);
      await moveIntoGroup(groups[constants.GROUP_NAMES.image]);
      log.ok("Film grain overlay");
    } catch (e) { log.warn("Film grain failed: " + e.message); }
  }

  var gfx = state.globalFx || {};
  if (gfx.grain > 0) {
    try {
      await makeFxLayer(constants.LAYER_NAMES.globalGrain, gfx.grain, "softLight", 128, 128, 128);
      await moveIntoGroup(groups[constants.GROUP_NAMES.globalFx]);
      log.ok("Global grain");
    } catch (e) { log.warn("Global grain failed: " + e.message); }
  }
  if (gfx.vignette > 0) {
    try {
      await makeFxLayer(constants.LAYER_NAMES.globalVignette, gfx.vignette, "multiply", 0, 0, 0);
      await moveIntoGroup(groups[constants.GROUP_NAMES.globalFx]);
      log.ok("Global vignette");
    } catch (e) { log.warn("Global vignette failed: " + e.message); }
  }

  return true;
}

async function makeFxLayer(name, opacity, blendMode, r, g, b) {
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

async function selectLayerByName(name) {
  await batchPlay([
    {
      _obj: "select",
      _target: [{ _ref: "layer", _name: name }],
      makeVisible: false,
    },
  ]);
}

// ====================================================================
// Verify layer tree
// ====================================================================

function verifyLayerTree(doc) {
  log.stage("verifyLayerTree");
  var required = Object.values(constants.GROUP_NAMES);
  var missing = [];
  for (var i = 0; i < required.length; i++) {
    var g = findGroupByName(doc, required[i]);
    if (!g) {
      missing.push(required[i]);
    } else {
      var count = g.layers ? g.layers.length : 0;
      log.info("  Group '" + required[i] + "': " + count + " layers");
    }
  }
  if (missing.length > 0) {
    log.fail("verifyLayerTree", new Error("Missing groups: " + missing.join(", ")));
    return false;
  }
  log.ok("All " + required.length + " groups present");
  return true;
}

function dumpBounds(doc) {
  log.stage("dumpBounds");
  for (var i = 0; i < doc.layers.length; i++) {
    var layer = doc.layers[i];
    var b = layer.bounds;
    var bStr = "x=" + b.left + " y=" + b.top + " w=" + (b.right - b.left) + " h=" + (b.bottom - b.top);
    log.info("  " + layer.name + " [" + (layer.layers !== undefined ? "GROUP" : "layer") + "] " + bStr);
    if (layer.layers !== undefined) {
      for (var j = 0; j < layer.layers.length; j++) {
        var sub = layer.layers[j];
        var sb = sub.bounds;
        log.info("    " + sub.name + " x=" + sb.left + " y=" + sb.top + " w=" + (sb.right - sb.left) + " h=" + (sb.bottom - sb.top));
      }
    }
  }
}

// ====================================================================
// Main pipeline
// ====================================================================

async function generateCard(state, opts) {
  var debugMode = opts.debugMode || false;
  var safeMode = opts.safeMode || false;
  var structureOnly = opts.structureOnly || false;

  log.clear();
  log.info("=== GENERATE CARD ===");
  log.info("Debug: " + debugMode + " | Safe: " + safeMode + " | Structure only: " + structureOnly);

  var stages = [
    { name: "prepareDocument", fn: null },
    { name: "renderBackground" },
    { name: "renderOuterFrame" },
    { name: "renderTitle" },
    { name: "renderImageSection" },
    { name: "renderBodyText" },
    { name: "renderDivider" },
    { name: "renderFooter" },
  ];

  var psModule = ps();
  var doc;
  var groups;

  // Stage: prepareDocument
  try {
    log.stage("prepareDocument");
    if (state.document.createNew || !psModule.app.activeDocument) {
      doc = await psModule.core.executeAsModal(
        async function () {
          return await psModule.app.createDocument({
            width: state.document.width || HARDCODED.width,
            height: state.document.height || HARDCODED.height,
            resolution: 72,
            mode: "RGBColorMode",
            fill: "transparent",
            name: "Noisecore Dreamlog",
          });
        },
        { commandName: "Create document" }
      );
      log.ok("Created document " + (state.document.width || HARDCODED.width) + "x" + (state.document.height || HARDCODED.height));
    } else {
      doc = psModule.app.activeDocument;
      log.ok("Using active document: " + doc.name);
    }
  } catch (e) {
    log.fail("prepareDocument", e);
    return false;
  }

  // Structure pass inside executeAsModal
  try {
    await psModule.core.executeAsModal(
      async function () {
        // Create groups
        groups = await createGroupsInOrder(doc);
        log.ok("Created " + Object.keys(groups).length + " groups");

        // Run each structure stage
        try { await renderBackground(doc, groups, state, debugMode); }
        catch (e) { log.fail("renderBackground", e); return; }

        try { await renderOuterFrame(doc, groups, state, debugMode); }
        catch (e) { log.fail("renderOuterFrame", e); return; }

        try { await renderTitle(doc, groups, state, debugMode); }
        catch (e) { log.fail("renderTitle", e); return; }

        try { await renderImageSection(doc, groups, state, debugMode); }
        catch (e) { log.fail("renderImageSection", e); return; }

        try { await renderBodyText(doc, groups, state, debugMode); }
        catch (e) { log.fail("renderBodyText", e); return; }

        try { await renderDivider(doc, groups, state, debugMode); }
        catch (e) { log.fail("renderDivider", e); return; }

        try { await renderFooter(doc, groups, state, debugMode); }
        catch (e) { log.fail("renderFooter", e); return; }

        log.ok("=== STRUCTURE PASS COMPLETE ===");

        // Pass 2: Style (only if not safe/structure-only mode)
        if (!safeMode && !structureOnly) {
          try {
            await applyFX(doc, groups, state, debugMode);
            log.ok("=== STYLE PASS COMPLETE ===");
          } catch (e) {
            log.warn("Style pass had errors but structure remains: " + e.message);
          }
        } else {
          log.info("Skipping style pass (safe=" + safeMode + " structureOnly=" + structureOnly + ")");
        }
      },
      { commandName: "Build Noisecore card" }
    );
  } catch (e) {
    log.fail("executeAsModal", e);
    return false;
  }

  // Verify
  verifyLayerTree(doc);
  log.info("=== GENERATION COMPLETE ===");
  return true;
}

async function validateAndDump() {
  var psModule = ps();
  var doc = psModule.app.activeDocument;
  if (!doc) {
    log.clear();
    log.fail("validate", new Error("No active document"));
    return;
  }
  log.clear();
  verifyLayerTree(doc);
  dumpBounds(doc);
}

async function resetDocument() {
  var psModule = ps();
  var doc = psModule.app.activeDocument;
  if (!doc) {
    log.info("No active document to reset");
    return;
  }
  log.clear();
  log.stage("resetDocument");
  await psModule.core.executeAsModal(
    async function () {
      var names = Object.values(constants.GROUP_NAMES);
      for (var i = 0; i < names.length; i++) {
        var g = findGroupByName(doc, names[i]);
        if (g) {
          while (g.layers && g.layers.length > 0) {
            await g.layers[0].delete();
          }
          await g.delete();
          log.ok("Deleted group: " + names[i]);
        }
      }
    },
    { commandName: "Reset Noisecore groups" }
  );
  log.ok("Document reset complete");
}

module.exports = {
  generateCard,
  validateAndDump,
  resetDocument,
  TEST_CONTENT,
  HARDCODED,
};

const photoshop = require("photoshop");
const { app, core, action } = photoshop;

function rgb(hex) {
  var clean = hex.replace("#", "");
  var h = clean.length === 3
    ? clean.split("").map(function(c) { return c + c; }).join("")
    : clean;
  var n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function bp(desc) {
  return action.batchPlay(desc, {});
}

function pxToPt(px, dpi) {
  return Math.max(1, Math.round(px * 72 / dpi));
}

async function runModal(name, fn) {
  return core.executeAsModal(fn, { commandName: name });
}

async function createDreamlogDocument(state) {
  await app.createDocument({
    width: state.doc.width,
    height: state.doc.height,
    resolution: state.doc.resolution,
    mode: "RGBColorMode",
    fill: "transparent",
    name: "Noisecore Dreamlog"
  });
  await buildComposition(state);
}

async function rebuildActiveDreamlog(state) {
  var doc = app.activeDocument;
  if (!doc) throw new Error("No active document.");
  while (doc.layers.length) { await doc.layers[0].delete(); }
  await buildComposition(state);
}

async function buildComposition(state) {
  var w = state.doc.width;
  var h = state.doc.height;
  var dpi = state.doc.resolution || 300;

  var titlePt = pxToPt(60, dpi);
  var bodyPt = pxToPt(24, dpi);
  var bodyLeadPt = pxToPt(36, dpi);
  var footerPt = pxToPt(24, dpi);

  // 1. Background fills (bottom of stack)
  try {
    await makeSolidFill("Background A", state.colors.bgA, "normal", 100);
    await makeSolidFill("Background B", state.colors.bgB, "multiply", 68);
  } catch (e) { console.error("BG:", e); }

  // 2. Outer border + glow
  try {
    await makeStrokeRect("Outer Border", {
      x: 56, y: 56, w: w - 112, h: h - 112,
      radius: 24, color: state.colors.border, stroke: 4
    });
    await addOuterGlow(state.colors.border, state.fx.glow || 55, 32);
  } catch (e) { console.error("Border:", e); }

  // 3. Image area
  var imgX = 110, imgY = 240, imgW = w - 220, imgH = 460, imgR = 20;
  try {
    if (state.image && state.image.token) {
      await placeLinkedImage(state.image);
    } else {
      await makeSolidRect("Image Placeholder", "#1f1f28", imgX, imgY, imgW, imgH, imgR);
    }
    await makeStrokeRect("Image Border", {
      x: imgX, y: imgY, w: imgW, h: imgH,
      radius: imgR, color: state.colors.border, stroke: 3
    });
    await addOuterGlow(state.colors.border, 40, 16);
  } catch (e) { console.error("Image:", e); }

  // 4. Title
  try {
    await makePointText("Title", state.content.title || "UNTITLED", {
      xPct: 50, yPct: (140 / h) * 100,
      size: titlePt, color: state.colors.title,
      font: "TrajanPro-Regular", align: "center"
    });
  } catch (e) { console.error("Title:", e); }

  // 5. Body paragraph
  try {
    if (state.content.body) {
      await makeBoxText("Body", state.content.body, {
        top: h - 420, left: 96, bottom: h - 180, right: w - 96,
        size: bodyPt, leading: bodyLeadPt,
        color: state.colors.body,
        font: "CormorantGaramond-Regular", align: "left"
      });
    }
  } catch (e) { console.error("Body:", e); }

  // 6. Divider + glow
  try {
    await makeSolidRect("Divider", state.colors.border, 96, h - 170, w - 192, 3, 0);
    await addOuterGlow(state.colors.border, 35, 8);
  } catch (e) { console.error("Divider:", e); }

  // 7. Footer
  try {
    var ft = "NOISECORE // " + (state.content.footerRight || "DREAMLOG");
    await makePointText("Footer", ft, {
      xPct: 50, yPct: ((h - 100) / h) * 100,
      size: footerPt, color: state.colors.footer,
      font: "Cinzel-Regular", align: "center"
    });
  } catch (e) { console.error("Footer:", e); }

  // 8. CRT scanlines
  try {
    if (state.fx.crtOpacity > 0) {
      await makeNoiseOverlay("CRT Scanlines", state.fx.crtOpacity, "softLight", true, w);
    }
  } catch (e) { console.error("CRT:", e); }

  // 9. Film grain
  try {
    if (state.fx.grainOpacity > 0) {
      await makeNoiseOverlay("Film Grain", state.fx.grainOpacity, "overlay", false, 0);
    }
  } catch (e) { console.error("Grain:", e); }
}

async function makeSolidFill(name, hex, blendMode, opacity) {
  var c = rgb(hex);
  await bp([{
    _obj: "make",
    _target: [{ _ref: "contentLayer" }],
    using: {
      _obj: "contentLayer",
      type: {
        _obj: "solidColorLayer",
        color: { _obj: "RGBColor", red: c.r, grain: c.g, blue: c.b }
      }
    }
  }]);
  var desc = { _obj: "layer", name: name, opacity: { _unit: "percentUnit", _value: opacity } };
  if (blendMode !== "normal") desc.mode = { _enum: "blendMode", _value: blendMode };
  await bp([{
    _obj: "set",
    _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
    to: desc
  }]);
}

async function makeSolidRect(name, hex, x, y, w, h, radius) {
  var c = rgb(hex);
  await bp([{
    _obj: "make",
    _target: [{ _ref: "contentLayer" }],
    using: {
      _obj: "contentLayer",
      type: {
        _obj: "solidColorLayer",
        color: { _obj: "RGBColor", red: c.r, grain: c.g, blue: c.b }
      },
      shape: {
        _obj: "rectangle",
        unitValueQuadVersion: 1,
        top: { _unit: "pixelsUnit", _value: y },
        left: { _unit: "pixelsUnit", _value: x },
        bottom: { _unit: "pixelsUnit", _value: y + h },
        right: { _unit: "pixelsUnit", _value: x + w },
        topRight: { _unit: "pixelsUnit", _value: radius || 0 },
        topLeft: { _unit: "pixelsUnit", _value: radius || 0 },
        bottomLeft: { _unit: "pixelsUnit", _value: radius || 0 },
        bottomRight: { _unit: "pixelsUnit", _value: radius || 0 }
      }
    }
  }]);
  await bp([{
    _obj: "set",
    _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
    to: { _obj: "layer", name: name }
  }]);
}

async function makeStrokeRect(name, spec) {
  var sc = rgb(spec.color);
  await bp([{
    _obj: "make",
    _target: [{ _ref: "contentLayer" }],
    using: {
      _obj: "contentLayer",
      type: {
        _obj: "solidColorLayer",
        color: { _obj: "RGBColor", red: 0, grain: 0, blue: 0 }
      },
      shape: {
        _obj: "rectangle",
        unitValueQuadVersion: 1,
        top: { _unit: "pixelsUnit", _value: spec.y },
        left: { _unit: "pixelsUnit", _value: spec.x },
        bottom: { _unit: "pixelsUnit", _value: spec.y + spec.h },
        right: { _unit: "pixelsUnit", _value: spec.x + spec.w },
        topRight: { _unit: "pixelsUnit", _value: spec.radius || 0 },
        topLeft: { _unit: "pixelsUnit", _value: spec.radius || 0 },
        bottomLeft: { _unit: "pixelsUnit", _value: spec.radius || 0 },
        bottomRight: { _unit: "pixelsUnit", _value: spec.radius || 0 }
      },
      strokeStyle: {
        _obj: "strokeStyle",
        strokeStyleVersion: 2,
        strokeEnabled: true,
        fillEnabled: false,
        strokeStyleLineWidth: { _unit: "pixelsUnit", _value: spec.stroke },
        strokeStyleLineAlignment: { _enum: "strokeStyleLineAlignment", _value: "strokeStyleAlignCenter" },
        strokeStyleContent: {
          _obj: "solidColorLayer",
          color: { _obj: "RGBColor", red: sc.r, grain: sc.g, blue: sc.b }
        },
        strokeStyleOpacity: { _unit: "percentUnit", _value: 100 }
      }
    }
  }]);
  await bp([{
    _obj: "set",
    _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
    to: { _obj: "layer", name: name }
  }]);
}

async function addOuterGlow(hex, opacity, size) {
  var c = rgb(hex);
  try {
    await bp([{
      _obj: "set",
      _target: [
        { _ref: "property", _property: "layerEffects" },
        { _ref: "layer", _enum: "ordinal", _value: "targetEnum" }
      ],
      to: {
        _obj: "layerEffects",
        outerGlow: {
          _obj: "outerGlow",
          enabled: true,
          mode: { _enum: "blendMode", _value: "screen" },
          color: { _obj: "RGBColor", red: c.r, grain: c.g, blue: c.b },
          opacity: { _unit: "percentUnit", _value: opacity },
          blur: { _unit: "pixelsUnit", _value: size }
        }
      }
    }]);
  } catch (e) { console.error("glow:", e); }
}

async function makePointText(name, text, spec) {
  var c = rgb(spec.color);
  var ts = {
    _obj: "textStyle",
    fontPostScriptName: spec.font || "ArialMT",
    size: { _unit: "pointsUnit", _value: spec.size },
    color: { _obj: "RGBColor", red: c.r, grain: c.g, blue: c.b },
    antiAlias: { _enum: "antiAliasType", _value: "antiAliasSmooth" }
  };

  var desc = {
    _obj: "textLayer",
    textKey: text,
    warp: { _obj: "warp", warpStyle: { _enum: "warpStyle", _value: "warpNone" } },
    textClickPoint: {
      _obj: "paint",
      horizontal: { _unit: "percentUnit", _value: spec.xPct },
      vertical: { _unit: "percentUnit", _value: spec.yPct }
    },
    antiAlias: { _enum: "antiAliasType", _value: "antiAliasSmooth" },
    textStyleRange: [{
      _obj: "textStyleRange",
      from: 0, to: text.length,
      textStyle: ts
    }],
    paragraphStyleRange: [{
      _obj: "paragraphStyleRange",
      from: 0, to: text.length,
      paragraphStyle: {
        _obj: "paragraphStyle",
        align: { _enum: "alignmentType", _value: spec.align || "center" }
      }
    }]
  };

  try {
    await bp([{ _obj: "make", _target: [{ _ref: "textLayer" }], using: desc }]);
  } catch (e) {
    desc.textStyleRange[0].textStyle.fontPostScriptName = "ArialMT";
    try {
      await bp([{ _obj: "make", _target: [{ _ref: "textLayer" }], using: desc }]);
    } catch (e2) { console.error("text " + name + ":", e2); return; }
  }
  await bp([{
    _obj: "set",
    _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
    to: { _obj: "layer", name: name }
  }]);
}

async function makeBoxText(name, text, spec) {
  var c = rgb(spec.color);
  var ts = {
    _obj: "textStyle",
    fontPostScriptName: spec.font || "ArialMT",
    size: { _unit: "pointsUnit", _value: spec.size },
    color: { _obj: "RGBColor", red: c.r, grain: c.g, blue: c.b },
    antiAlias: { _enum: "antiAliasType", _value: "antiAliasSmooth" },
    autoLeading: false,
    leading: { _unit: "pointsUnit", _value: spec.leading || spec.size + 2 }
  };

  var desc = {
    _obj: "textLayer",
    textKey: text,
    warp: { _obj: "warp", warpStyle: { _enum: "warpStyle", _value: "warpNone" } },
    textShape: [{
      _obj: "textShape",
      char: { _enum: "char", _value: "box" },
      bounds: {
        _obj: "rectangle",
        top: { _unit: "pixelsUnit", _value: spec.top },
        left: { _unit: "pixelsUnit", _value: spec.left },
        bottom: { _unit: "pixelsUnit", _value: spec.bottom },
        right: { _unit: "pixelsUnit", _value: spec.right }
      },
      orientation: { _enum: "orientation", _value: "horizontal" }
    }],
    textStyleRange: [{
      _obj: "textStyleRange",
      from: 0, to: text.length,
      textStyle: ts
    }],
    paragraphStyleRange: [{
      _obj: "paragraphStyleRange",
      from: 0, to: text.length,
      paragraphStyle: {
        _obj: "paragraphStyle",
        align: { _enum: "alignmentType", _value: spec.align || "left" }
      }
    }]
  };

  try {
    await bp([{ _obj: "make", _target: [{ _ref: "textLayer" }], using: desc }]);
  } catch (e) {
    desc.textStyleRange[0].textStyle.fontPostScriptName = "ArialMT";
    try {
      await bp([{ _obj: "make", _target: [{ _ref: "textLayer" }], using: desc }]);
    } catch (e2) { console.error("text " + name + ":", e2); return; }
  }
  await bp([{
    _obj: "set",
    _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
    to: { _obj: "layer", name: name }
  }]);
}

async function placeLinkedImage(imageInfo) {
  var path = imageInfo.nativePath || imageInfo.token;
  await bp([{
    _obj: "placeEvent",
    null: { _path: path, _kind: "local" },
    freeTransformCenterState: { _enum: "quadCenterState", _value: "QCSAverage" },
    offset: {
      _obj: "offset",
      horizontal: { _unit: "pixelsUnit", _value: 0 },
      vertical: { _unit: "pixelsUnit", _value: 0 }
    }
  }]);
  await bp([{
    _obj: "set",
    _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
    to: { _obj: "layer", name: "Image" }
  }]);
}

async function makeNoiseOverlay(name, opacity, blendMode, useMotionBlur, blurDist) {
  await bp([{
    _obj: "make",
    _target: [{ _ref: "layer" }],
    using: { _obj: "layer", name: name }
  }]);

  await bp([{
    _obj: "fill",
    using: { _enum: "fillContents", _value: "color" },
    color: { _obj: "RGBColor", red: 128, grain: 128, blue: 128 },
    opacity: { _unit: "percentUnit", _value: 100 },
    mode: { _enum: "blendMode", _value: "normal" }
  }]);

  try {
    await bp([{
      _obj: "addNoise",
      distribution: { _enum: "distribution", _value: "gaussian" },
      amount: useMotionBlur ? 50 : 30,
      monochromatic: true
    }]);
  } catch (e) { console.error("addNoise:", e); }

  if (useMotionBlur && blurDist > 0) {
    try {
      await bp([{
        _obj: "motionBlur",
        angle: 0,
        distance: blurDist
      }]);
    } catch (e) { console.error("motionBlur:", e); }
  }

  await bp([{
    _obj: "set",
    _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
    to: {
      _obj: "layer",
      mode: { _enum: "blendMode", _value: blendMode },
      opacity: { _unit: "percentUnit", _value: opacity }
    }
  }]);
}

module.exports = { runModal, createDreamlogDocument, rebuildActiveDreamlog };

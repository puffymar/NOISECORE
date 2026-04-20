const photoshop = require("photoshop");
const { app, core, action } = photoshop;

function rgb(hex) {
  var clean = hex.replace("#", "");
  var h = clean.length === 3
    ? clean.split("").map(function(c) { return c + c; }).join("")
    : clean;
  var n = parseInt(h, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255
  };
}

function bp(descriptors) {
  return action.batchPlay(descriptors, {});
}

async function runModal(commandName, fn) {
  return core.executeAsModal(fn, { commandName });
}

async function moveLayerIntoGroup(group) {
  if (!group) return;
  var doc = app.activeDocument;
  var layer = doc.activeLayers[0];
  if (!layer) return;
  try {
    layer.move(group, photoshop.constants.ElementPlacement.PLACEINSIDE);
    return;
  } catch (_) {}
  try {
    await bp([{
      _obj: "move",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      to: { _ref: "layer", _id: group.id },
      adjustment: false,
      version: 5
    }]);
  } catch (__) {
    console.error("moveIntoGroup failed");
  }
}

async function selectLayerByName(name) {
  try {
    await bp([{
      _obj: "select",
      _target: [{ _ref: "layer", _name: name }],
      makeVisible: false
    }]);
  } catch (_) {}
}

async function createDreamlogDocument(state) {
  var doc = await app.createDocument({
    width: state.doc.width,
    height: state.doc.height,
    resolution: state.doc.resolution,
    mode: "RGBColorMode",
    fill: "transparent",
    name: "Noisecore Dreamlog"
  });
  await buildComposition(doc, state);
  return doc;
}

async function rebuildActiveDreamlog(state) {
  var doc = app.activeDocument;
  if (!doc) throw new Error("No active document.");
  while (doc.layers.length) {
    await doc.layers[0].delete();
  }
  await buildComposition(doc, state);
}

async function buildComposition(doc, state) {
  var bgGroup = await doc.createLayerGroup({ name: "BG" });
  var frameGroup = await doc.createLayerGroup({ name: "Frame" });
  var contentGroup = await doc.createLayerGroup({ name: "Content" });
  var fxGroup = await doc.createLayerGroup({ name: "FX" });

  var w = state.doc.width;
  var h = state.doc.height;

  // BG
  await addSolid(bgGroup, "Background A", state.colors.bgA, "normal", 100);
  await addSolid(bgGroup, "Background B", state.colors.bgB, "multiply", 68);

  // Outer border
  await addStrokeRect(frameGroup, "Outer Border", {
    x: 56, y: 56, w: w - 112, h: h - 112,
    radius: 24, color: state.colors.border, stroke: 4
  });
  await applyOuterGlow(state.colors.border, state.fx.glow || 55, 28);

  // Title
  try {
    await addText(contentGroup, "Title", state.content.title || "UNTITLED", {
      x: w / 2, y: 130,
      size: 72, color: state.colors.title,
      font: "TrajanPro-Regular", justify: "center"
    });
  } catch (e) { console.error("Title failed:", e); }

  // Image
  try {
    await placeImage(contentGroup, state);
  } catch (e) { console.error("Image failed:", e); }

  // Body
  try {
    if (state.content.body) {
      await addText(contentGroup, "Body", state.content.body, {
        x: 96, y: h - 420, size: 28,
        color: state.colors.body, font: "CormorantGaramond-Regular",
        justify: "left", boxWidth: w - 192, boxHeight: 280, leading: 40
      });
    }
  } catch (e) { console.error("Body failed:", e); }

  // Divider
  try {
    await addDivider(contentGroup, "Divider", state.colors.border, {
      x: 96, y: h - 170, w: w - 192, thickness: 3
    });
  } catch (e) { console.error("Divider failed:", e); }

  // Footer
  try {
    var footerText = "NOISECORE // " + (state.content.footerRight || "DREAMLOG");
    await addText(contentGroup, "Footer", footerText, {
      x: w / 2, y: h - 120, size: 28,
      color: state.colors.footer, font: "Cinzel-Regular", justify: "center"
    });
  } catch (e) { console.error("Footer failed:", e); }

  // FX overlays
  try {
    if (state.fx.crtOpacity > 0) {
      await addSolid(fxGroup, "CRT Scanlines", "#7f7f7f", "softLight", state.fx.crtOpacity);
    }
    if (state.fx.grainOpacity > 0) {
      await addSolid(fxGroup, "Film Grain", "#808080", "overlay", state.fx.grainOpacity);
    }
  } catch (e) { console.error("FX failed:", e); }
}

// ---- Solid fill layer ------------------------------------------------

async function addSolid(group, name, hex, blendMode, opacity) {
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
  var setDesc = {
    _obj: "layer",
    name: name,
    opacity: { _unit: "percentUnit", _value: opacity }
  };
  if (blendMode && blendMode !== "normal") {
    setDesc.mode = { _enum: "blendMode", _value: blendMode };
  }
  await bp([{
    _obj: "set",
    _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
    to: setDesc
  }]);
  await moveLayerIntoGroup(group);
}

// ---- Stroke rectangle ------------------------------------------------

async function addStrokeRect(group, name, spec) {
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
        topRight: { _unit: "pixelsUnit", _value: spec.radius },
        topLeft: { _unit: "pixelsUnit", _value: spec.radius },
        bottomLeft: { _unit: "pixelsUnit", _value: spec.radius },
        bottomRight: { _unit: "pixelsUnit", _value: spec.radius }
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
  await moveLayerIntoGroup(group);
}

// ---- Outer glow effect -----------------------------------------------

async function applyOuterGlow(hex, opacity, size) {
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
  } catch (e) { console.error("applyOuterGlow failed:", e); }
}

// ---- Text layer (all-in-one make) ------------------------------------

async function addText(group, name, text, spec) {
  if (!text) text = name;
  var c = rgb(spec.color);
  var just = spec.justify === "center" ? "center" : spec.justify === "right" ? "right" : "left";

  var textStyle = {
    _obj: "textStyle",
    fontPostScriptName: spec.font || "ArialMT",
    size: { _unit: "pointsUnit", _value: spec.size },
    color: { _obj: "RGBColor", red: c.r, grain: c.g, blue: c.b },
    antiAlias: { _enum: "antiAliasType", _value: "antiAliasSmooth" }
  };
  if (spec.leading) {
    textStyle.autoLeading = false;
    textStyle.leading = { _unit: "pointsUnit", _value: spec.leading };
  }

  var paragraphStyle = {
    _obj: "paragraphStyle",
    align: { _enum: "alignmentType", _value: just }
  };

  var textDesc = {
    _obj: "textLayer",
    textKey: text,
    textStyleRange: [{
      _obj: "textStyleRange",
      from: 0, to: text.length,
      textStyle: textStyle
    }],
    paragraphStyleRange: [{
      _obj: "paragraphStyleRange",
      from: 0, to: text.length,
      paragraphStyle: paragraphStyle
    }]
  };

  if (spec.boxWidth && spec.boxHeight) {
    textDesc.textShape = [{
      _obj: "textShape",
      char: { _enum: "char", _value: "box" },
      bounds: {
        _obj: "rectangle",
        top: { _unit: "pixelsUnit", _value: spec.y },
        left: { _unit: "pixelsUnit", _value: spec.x },
        bottom: { _unit: "pixelsUnit", _value: spec.y + spec.boxHeight },
        right: { _unit: "pixelsUnit", _value: spec.x + spec.boxWidth }
      },
      orientation: { _enum: "orientation", _value: "horizontal" }
    }];
  } else {
    textDesc.textClickPoint = {
      _obj: "paint",
      horizontal: { _unit: "pixelsUnit", _value: spec.x },
      vertical: { _unit: "pixelsUnit", _value: spec.y }
    };
  }

  await bp([{
    _obj: "make",
    _target: [{ _ref: "textLayer" }],
    using: textDesc
  }]);

  await bp([{
    _obj: "set",
    _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
    to: { _obj: "layer", name: name }
  }]);

  await moveLayerIntoGroup(group);
}

// ---- Image placement -------------------------------------------------

async function placeImage(group, state) {
  var w = state.doc.width;
  var imgX = 110;
  var imgY = 240;
  var imgW = w - 220;
  var imgH = 460;
  var imgR = 20;

  if (!state.image || !state.image.token) {
    var c = rgb("#1f1f28");
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
          top: { _unit: "pixelsUnit", _value: imgY },
          left: { _unit: "pixelsUnit", _value: imgX },
          bottom: { _unit: "pixelsUnit", _value: imgY + imgH },
          right: { _unit: "pixelsUnit", _value: imgX + imgW },
          topRight: { _unit: "pixelsUnit", _value: imgR },
          topLeft: { _unit: "pixelsUnit", _value: imgR },
          bottomLeft: { _unit: "pixelsUnit", _value: imgR },
          bottomRight: { _unit: "pixelsUnit", _value: imgR }
        }
      }
    }]);
    await bp([{
      _obj: "set",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      to: { _obj: "layer", name: "Image Placeholder" }
    }]);
    await moveLayerIntoGroup(group);

    await addStrokeRect(group, "Image Border", {
      x: imgX, y: imgY, w: imgW, h: imgH,
      radius: imgR, color: state.colors.border, stroke: 3
    });
    await applyOuterGlow(state.colors.border, 40, 14);
    return;
  }

  // Place the picked image using its native path
  var imgPath = state.image.nativePath || state.image.token;
  await bp([{
    _obj: "placeEvent",
    null: { _path: imgPath, _kind: "local" },
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
  await moveLayerIntoGroup(group);

  await addStrokeRect(group, "Image Border", {
    x: imgX, y: imgY, w: imgW, h: imgH,
    radius: imgR, color: state.colors.border, stroke: 3
  });
  await applyOuterGlow(state.colors.border, 40, 14);
}

// ---- Divider ---------------------------------------------------------

async function addDivider(group, name, color, spec) {
  var c = rgb(color);
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
        top: { _unit: "pixelsUnit", _value: spec.y },
        left: { _unit: "pixelsUnit", _value: spec.x },
        bottom: { _unit: "pixelsUnit", _value: spec.y + spec.thickness },
        right: { _unit: "pixelsUnit", _value: spec.x + spec.w },
        topRight: { _unit: "pixelsUnit", _value: 0 },
        topLeft: { _unit: "pixelsUnit", _value: 0 },
        bottomLeft: { _unit: "pixelsUnit", _value: 0 },
        bottomRight: { _unit: "pixelsUnit", _value: 0 }
      }
    }
  }]);
  await bp([{
    _obj: "set",
    _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
    to: { _obj: "layer", name: name }
  }]);
  await moveLayerIntoGroup(group);
  await applyOuterGlow(color, 30, 6);
}

// ---- CRT / Grain overlays --------------------------------------------

async function addCrtOverlay(group, state) {
  await addSolid(group, "CRT Scanlines", "#7f7f7f", "softLight", state.fx.crtOpacity);
}

async function addGrainOverlay(group, state) {
  await addSolid(group, "Film Grain", "#808080", "overlay", state.fx.grainOpacity);
}

module.exports = {
  runModal,
  createDreamlogDocument,
  rebuildActiveDreamlog
};

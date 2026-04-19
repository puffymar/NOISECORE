const photoshop = require("photoshop");
const { app, core, action } = photoshop;

function rgb(hex) {
  const clean = hex.replace("#", "");
  const h = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  const n = parseInt(h, 16);
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

async function moveLayerIntoGroup(layer, group) {
  if (!layer || !group) return;
  try {
    layer.move(group, photoshop.constants.ElementPlacement.PLACEINSIDE);
  } catch (_) {
    try {
      await bp([{
        _obj: "move",
        _target: [{ _ref: "layer", _id: layer.id }],
        to: { _ref: "layer", _id: group.id },
        adjustment: false,
        version: 5
      }]);
    } catch (__) {
      console.error("moveLayerIntoGroup failed for", layer.name);
    }
  }
}

async function createDreamlogDocument(state) {
  const doc = await app.createDocument({
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
  const doc = app.activeDocument;
  if (!doc) throw new Error("No active document.");
  while (doc.layers.length) {
    await doc.layers[0].delete();
  }
  await buildComposition(doc, state);
}

async function buildComposition(doc, state) {
  const bgGroup = await doc.createLayerGroup({ name: "BG" });
  const frameGroup = await doc.createLayerGroup({ name: "Frame" });
  const contentGroup = await doc.createLayerGroup({ name: "Content" });
  const fxGroup = await doc.createLayerGroup({ name: "FX" });

  await addSolid(bgGroup, "Background A", state.colors.bgA, "normal", 100);
  await addSolid(bgGroup, "Background B", state.colors.bgB, "multiply", 68);

  var w = state.doc.width;
  var h = state.doc.height;

  await addStrokeRect(frameGroup, "Outer Border", {
    x: 56, y: 56,
    w: w - 112, h: h - 112,
    radius: 24,
    color: state.colors.border,
    stroke: 4
  });

  await applyOuterGlow(state.colors.border, state.fx.glow || 55, 28);

  await addText(contentGroup, "Title", state.content.title, {
    x: w / 2, y: 156,
    size: 86,
    color: state.colors.title,
    font: "TrajanPro-Regular",
    justify: "center"
  });

  await placeImage(contentGroup, state);

  if (state.content.body) {
    await addText(contentGroup, "Body", state.content.body, {
      x: 96, y: h - 420,
      size: 28,
      color: state.colors.body,
      font: "CormorantGaramond-Regular",
      justify: "left",
      boxWidth: w - 192,
      boxHeight: 280,
      leading: 40
    });
  }

  await addDivider(contentGroup, "Divider", state.colors.border, {
    x: 96, y: h - 170, w: w - 192, thickness: 3
  });

  await addText(contentGroup, "Footer", "NOISECORE // " + (state.content.footerRight || "DREAMLOG"), {
    x: w / 2, y: h - 130,
    size: 31,
    color: state.colors.footer,
    font: "Cinzel-Regular",
    justify: "center"
  });

  await addCrtOverlay(fxGroup, state);
  await addGrainOverlay(fxGroup, state);
}

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
  var layer = app.activeDocument.activeLayers[0];
  if (!layer) return;
  await bp([{
    _obj: "set",
    _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
    to: {
      _obj: "layer",
      name: name,
      opacity: { _unit: "percentUnit", _value: opacity }
    }
  }]);
  if (blendMode !== "normal") {
    await bp([{
      _obj: "set",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      to: {
        _obj: "layer",
        mode: { _enum: "blendMode", _value: blendMode }
      }
    }]);
  }
  layer = app.activeDocument.activeLayers[0];
  await moveLayerIntoGroup(layer, group);
}

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
  var layer = app.activeDocument.activeLayers[0];
  await moveLayerIntoGroup(layer, group);
}

async function applyOuterGlow(hex, opacity, size) {
  var c = rgb(hex);
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
}

async function addText(group, name, text, spec) {
  if (!text) text = name;
  var c = rgb(spec.color);

  if (spec.boxWidth && spec.boxHeight) {
    await bp([{
      _obj: "make",
      _target: [{ _ref: "textLayer" }],
      using: {
        _obj: "textLayer",
        textKey: text,
        textShape: [{
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
        }]
      }
    }]);
  } else {
    await bp([{
      _obj: "make",
      _target: [{ _ref: "textLayer" }],
      using: {
        _obj: "textLayer",
        textKey: text,
        textClickPoint: {
          _obj: "paint",
          horizontal: { _unit: "pixelsUnit", _value: spec.x },
          vertical: { _unit: "pixelsUnit", _value: spec.y }
        }
      }
    }]);
  }

  var styleDesc = {
    _obj: "textStyle",
    fontPostScriptName: spec.font || "ArialMT",
    size: { _unit: "pointsUnit", _value: spec.size },
    color: { _obj: "RGBColor", red: c.r, grain: c.g, blue: c.b },
    antiAlias: { _enum: "antiAliasType", _value: "antiAliasSmooth" }
  };
  if (spec.leading) {
    styleDesc.autoLeading = false;
    styleDesc.leading = { _unit: "pointsUnit", _value: spec.leading };
  }

  var just = spec.justify === "center" ? "center" : spec.justify === "right" ? "right" : "left";

  await bp([{
    _obj: "set",
    _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
    to: {
      _obj: "textLayer",
      textStyleRange: [{
        _obj: "textStyleRange",
        from: 0,
        to: text.length,
        textStyle: styleDesc
      }],
      paragraphStyleRange: [{
        _obj: "paragraphStyleRange",
        from: 0,
        to: text.length,
        paragraphStyle: {
          _obj: "paragraphStyle",
          align: { _enum: "alignmentType", _value: just }
        }
      }]
    }
  }]);

  await bp([{
    _obj: "set",
    _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
    to: { _obj: "layer", name: name }
  }]);

  var layer = app.activeDocument.activeLayers[0];
  await moveLayerIntoGroup(layer, group);
}

async function placeImage(group, state) {
  var w = state.doc.width;
  var imgX = 110;
  var imgY = 240;
  var imgW = w - 220;
  var imgH = 460;
  var imgR = 20;

  if (!state.image.token) {
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
    var placeholderLayer = app.activeDocument.activeLayers[0];
    await moveLayerIntoGroup(placeholderLayer, group);

    await addStrokeRect(group, "Image Border", {
      x: imgX, y: imgY, w: imgW, h: imgH,
      radius: imgR,
      color: state.colors.border,
      stroke: 3
    });
    await applyOuterGlow(state.colors.border, 40, 14);
    return;
  }

  await bp([{
    _obj: "placeEvent",
    null: { _path: state.image.token, _kind: "local" },
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
  var placedLayer = app.activeDocument.activeLayers[0];
  await moveLayerIntoGroup(placedLayer, group);

  await addStrokeRect(group, "Image Border", {
    x: imgX, y: imgY, w: imgW, h: imgH,
    radius: imgR,
    color: state.colors.border,
    stroke: 3
  });
  await applyOuterGlow(state.colors.border, 40, 14);
}

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
  var layer = app.activeDocument.activeLayers[0];
  await moveLayerIntoGroup(layer, group);
}

async function addCrtOverlay(group, state) {
  await addSolid(group, "CRT Scanlines", "#7f7f7f", "softLight", state.fx.crtOpacity);
}

async function addGrainOverlay(group, state) {
  await addSolid(group, "Film Grain " + state.fx.grainSeed, "#808080", "overlay", state.fx.grainOpacity);
}

module.exports = {
  runModal,
  createDreamlogDocument,
  rebuildActiveDreamlog
};

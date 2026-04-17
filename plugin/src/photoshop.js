const photoshop = require("photoshop");
const { app, core, action } = photoshop;

function rgb(hex) {
  const clean = hex.replace("#", "");
  const value = clean.length === 3
    ? clean.split("").map((n) => n + n).join("")
    : clean;
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

async function runModal(commandName, fn) {
  return core.executeAsModal(fn, { commandName });
}

async function createDreamlogDocument(state) {
  const doc = await app.createDocument({
    width: state.doc.width,
    height: state.doc.height,
    resolution: state.doc.resolution,
    fill: "black"
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
  const groups = {
    bg: await doc.layerTree.addGroup("BG"),
    frame: await doc.layerTree.addGroup("Frame"),
    content: await doc.layerTree.addGroup("Content"),
    fx: await doc.layerTree.addGroup("FX")
  };

  await addSolid(groups.bg, "Background A", state.colors.bgA, "normal", 100);
  await addSolid(groups.bg, "Background B", state.colors.bgB, "multiply", 68);

  await addStrokeRect(groups.frame, "Outer Border", {
    x: 56,
    y: 56,
    w: state.doc.width - 112,
    h: state.doc.height - 112,
    radius: 24,
    color: state.colors.border,
    stroke: 4
  });

  await addText(groups.content, "Title", state.content.title, {
    x: 94,
    y: 156,
    size: 86,
    color: state.colors.title,
    font: "TrajanPro-Regular"
  });

  await placeImage(groups.content, state);

  await addText(groups.content, "Body", state.content.body, {
    x: 96,
    y: state.doc.height - 382,
    size: 35,
    color: state.colors.body,
    font: "CormorantGaramond-Regular"
  });

  await addDivider(groups.content, "Divider", state.colors.border, state.doc.height - 170);
  await addText(groups.content, "Footer", `NOISECORE // ${state.content.footerRight}`, {
    x: 96,
    y: state.doc.height - 130,
    size: 31,
    color: state.colors.footer,
    font: "Cinzel-Regular"
  });

  await addCrtOverlay(groups.fx, state);
  await addGrainOverlay(groups.fx, state);
}

async function addSolid(parent, name, hex, blendMode, opacity) {
  const { r, g, b } = rgb(hex);
  await action.batchPlay([
    {
      _obj: "make",
      _target: [{ _ref: "contentLayer" }],
      using: {
        _obj: "contentLayer",
        name,
        type: {
          _obj: "solidColorLayer",
          color: { _obj: "RGBColor", red: r, grain: g, blue: b }
        }
      }
    }
  ], {});
  const layer = app.activeDocument.activeLayers[0];
  await layer.move(parent, "inside");
  layer.opacity = opacity;
  layer.blendMode = blendMode;
}

async function addStrokeRect(parent, name, spec) {
  await action.batchPlay([
    {
      _obj: "make",
      _target: [{ _ref: "contentLayer" }],
      using: {
        _obj: "contentLayer",
        name,
        type: {
          _obj: "solidColorLayer",
          color: { _obj: "RGBColor", red: 0, grain: 0, blue: 0 }
        },
        shape: {
          _obj: "roundedRectangle",
          top: { _unit: "pixelsUnit", _value: spec.y },
          left: { _unit: "pixelsUnit", _value: spec.x },
          bottom: { _unit: "pixelsUnit", _value: spec.y + spec.h },
          right: { _unit: "pixelsUnit", _value: spec.x + spec.w },
          radius: { _unit: "pixelsUnit", _value: spec.radius }
        }
      }
    }
  ], {});
  const layer = app.activeDocument.activeLayers[0];
  await layer.move(parent, "inside");
  layer.name = name;
  const { r, g, b } = rgb(spec.color);
  await action.batchPlay([
    {
      _obj: "set",
      _target: [{ _ref: "contentLayer", _id: layer.id }],
      to: {
        _obj: "shapeStyle",
        strokeStyle: {
          _obj: "strokeStyle",
          strokeStyleLineWidth: { _unit: "pixelsUnit", _value: spec.stroke },
          strokeStyleContent: {
            _obj: "solidColorLayer",
            color: { _obj: "RGBColor", red: r, grain: g, blue: b }
          }
        }
      }
    }
  ], {});
}

async function addText(parent, name, text, spec) {
  const layer = await app.activeDocument.createTextLayer();
  layer.name = name;
  layer.textItem.contents = text;
  layer.textItem.size = spec.size;
  layer.textItem.font = spec.font;
  layer.textItem.position = [spec.x, spec.y];
  const { r, g, b } = rgb(spec.color);
  layer.textItem.color = { red: r, green: g, blue: b };
  await layer.move(parent, "inside");
}

async function placeImage(parent, state) {
  if (!state.image.token) {
    await addSolid(parent, "Image Placeholder", "#1f1f28", "normal", 100);
    return;
  }
  await action.batchPlay([
    {
      _obj: "placeEvent",
      target: { _path: state.image.token, _kind: "local" }
    }
  ], {});
  const layer = app.activeDocument.activeLayers[0];
  layer.name = "Image";
  await layer.move(parent, "inside");
}

async function addDivider(parent, name, color, y) {
  const layer = await app.activeDocument.createTextLayer();
  layer.name = name;
  layer.textItem.contents = "————————————————————————";
  layer.textItem.size = 16;
  layer.textItem.font = "ArialMT";
  layer.textItem.position = [96, y];
  const { r, g, b } = rgb(color);
  layer.textItem.color = { red: r, green: g, blue: b };
  await layer.move(parent, "inside");
}

async function addCrtOverlay(parent, state) {
  await addSolid(parent, "CRT Scanlines", "#7f7f7f", "softLight", state.fx.crtOpacity);
}

async function addGrainOverlay(parent, state) {
  await addSolid(parent, `Film Grain ${state.fx.grainSeed}`, "#808080", "overlay", state.fx.grainOpacity);
}

module.exports = {
  runModal,
  createDreamlogDocument,
  rebuildActiveDreamlog
};

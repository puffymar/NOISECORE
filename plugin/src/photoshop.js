const photoshop = require("photoshop");
const { app, core, action } = photoshop;

function rgb(hex) {
  const clean = (hex || "#ffffff").replace("#", "");
  const value = clean.length === 3 ? clean.split("").map((n) => n + n).join("") : clean;
  return {
    r: parseInt(value.slice(0, 2), 16) || 255,
    g: parseInt(value.slice(2, 4), 16) || 255,
    b: parseInt(value.slice(4, 6), 16) || 255
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
  try {
    while (doc.layers.length) {
      await doc.layers[0].delete();
    }
  } catch (error) {
  }
  await buildComposition(doc, state);
}

async function buildComposition(doc, state) {
  await safe(() => addSolid("Background", state.colors.bgA, "normal", 100));
  await safe(() => addSolid("Tint", state.colors.bgB, "multiply", 60));
  await safe(() => placeImage(state));

  const titleLayer = await safeResult(() => addText("Title", state.content.title, {
    x: 94,
    y: 156,
    size: state.typography.titleSize,
    color: state.colors.title,
    font: state.typography.titleFont
  }));

  await safe(() => addText("Body", state.content.body, {
    x: 96,
    y: state.doc.height - 382,
    size: state.typography.bodySize,
    color: state.colors.body,
    font: state.typography.bodyFont
  }));

  await safe(() => addText("Footer", `NOISECORE // ${state.content.footerRight}`, {
    x: 96,
    y: state.doc.height - 130,
    size: state.typography.footerSize,
    color: state.colors.footer,
    font: state.typography.footerFont
  }));

  await safe(() => addCrtOverlay(state));
  await safe(() => addGrainOverlay(state));

  if (titleLayer && state.fx.titleGlowEnabled) {
    await safe(() => addTextGlow(titleLayer, state));
  }
}

async function safe(fn) {
  try {
    await fn();
  } catch (error) {
  }
}

async function safeResult(fn) {
  try {
    return await fn();
  } catch (error) {
    return null;
  }
}

async function addSolid(name, hex, blendMode, opacity) {
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
  if (layer) {
    layer.opacity = opacity;
    layer.blendMode = blendMode;
  }
}

async function addText(name, text, spec) {
  const layer = await app.activeDocument.createTextLayer();
  layer.name = name;
  layer.textItem.contents = text;
  layer.textItem.size = spec.size;
  layer.textItem.font = spec.font;
  layer.textItem.position = [spec.x, spec.y];
  const { r, g, b } = rgb(spec.color);
  layer.textItem.color = { red: r, green: g, blue: b };
  return layer;
}

async function placeImage(state) {
  if (!state.image.token) return;
  await action.batchPlay([
    {
      _obj: "placeEvent",
      target: { _path: state.image.token, _kind: "local" }
    }
  ], {});
  const layer = app.activeDocument.activeLayers[0];
  if (layer) {
    layer.name = "Image";
  }
}

async function addCrtOverlay(state) {
  await addSolid("CRT Scanlines", "#7f7f7f", "softLight", state.fx.crtOpacity);
}

async function addGrainOverlay(state) {
  await addSolid(`Film Grain ${state.fx.grainSeed}`, "#808080", "overlay", state.fx.grainOpacity);
}

async function addTextGlow(layer, state) {
  await action.batchPlay([
    {
      _obj: "set",
      _target: [{ _ref: "layer", _id: layer.id }],
      to: {
        _obj: "layerEffects",
        outerGlow: {
          _obj: "outerGlow",
          enabled: true,
          opacity: { _unit: "percentUnit", _value: state.fx.titleGlowOpacity },
          blur: { _unit: "pixelsUnit", _value: state.fx.titleGlowBlur },
          color: {
            _obj: "RGBColor",
            red: 255,
            grain: 99,
            blue: 56
          }
        }
      }
    }
  ], {});
}

module.exports = {
  runModal,
  createDreamlogDocument,
  rebuildActiveDreamlog
};

/*
 * Noisecore Dreamlog — docManager.js
 *
 * Creates or targets the Photoshop document and manages the top-level
 * layer groups.
 */

const { GROUP_NAMES } = require("../utils/constants.js");

function ps() { return require("photoshop"); }
function core() { return ps().core; }
function app()  { return ps().app; }
function action() { return ps().action; }
function constants() { return ps().constants; }

async function createDocument(width, height, name) {
  return await core().executeAsModal(
    async function () {
      return await app().createDocument({
        width: width,
        height: height,
        resolution: 72,
        mode: "RGBColorMode",
        fill: "transparent",
        name: name || "Noisecore Dreamlog",
      });
    },
    { commandName: "Create Noisecore document" }
  );
}

function findGroup(name) {
  var doc = app().activeDocument;
  if (!doc) return null;
  for (var i = 0; i < doc.layers.length; i++) {
    var layer = doc.layers[i];
    // UXP: check for group via .isGroupLayer or .layerKind or just by presence of .layers
    if (layer.name === name && layer.layers !== undefined) return layer;
  }
  return null;
}

async function ensureGroup(name) {
  var g = findGroup(name);
  if (g) return g;
  var doc = app().activeDocument;
  g = await doc.createLayerGroup({ name: name });
  return g;
}

async function ensureAllGroups() {
  var order = [
    GROUP_NAMES.bg,
    GROUP_NAMES.frame,
    GROUP_NAMES.title,
    GROUP_NAMES.image,
    GROUP_NAMES.body,
    GROUP_NAMES.footer,
    GROUP_NAMES.globalFx,
  ];
  var out = {};
  for (var i = 0; i < order.length; i++) {
    out[order[i]] = await ensureGroup(order[i]);
  }
  return out;
}

async function clearGroup(name) {
  var g = findGroup(name);
  if (!g) return;
  while (g.layers && g.layers.length > 0) {
    await g.layers[0].delete();
  }
}

// Move the currently active layer into a group using batchPlay
// (the DOM layer.move method has inconsistent behavior with string args)
async function moveActiveLayerIntoGroup(group) {
  if (!group) return;
  try {
    await action().batchPlay(
      [
        {
          _obj: "move",
          _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
          to: { _ref: "layer", _id: group.id },
          adjustment: false,
          version: 5,
        },
      ],
      {}
    );
  } catch (e) {
    console.error("moveActiveLayerIntoGroup failed:", e);
  }
}

module.exports = {
  createDocument,
  findGroup,
  ensureGroup,
  ensureAllGroups,
  clearGroup,
  moveActiveLayerIntoGroup,
  _ps: ps,
  _core: core,
  _app: app,
  _action: action,
  _constants: constants,
};

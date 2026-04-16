/*
 * Noisecore Dreamlog — docManager.js
 *
 * Creates or targets the Photoshop document and manages the top-level
 * layer groups. Everything that actually touches the Photoshop API
 * goes through app, core, or action from the "photoshop" module.
 */

const { GROUP_NAMES } = require("../utils/constants.js");

// Lazily resolved so tests / non-PS environments don't crash on import.
function ps() { return require("photoshop"); }
function core() { return ps().core; }
function app()  { return ps().app; }
function action() { return ps().action; }

async function createDocument(width, height, name) {
  return await core().executeAsModal(
    async () => {
      return await app().createDocument({
        width,
        height,
        resolution: 72,
        mode: "RGBColorMode",
        fill: "transparent",
        name: name || "Noisecore Dreamlog",
      });
    },
    { commandName: "Create Noisecore document" }
  );
}

// Find a top-level group by name in the active document. Returns null
// if not present.
function findGroup(name) {
  const doc = app().activeDocument;
  if (!doc) return null;
  for (const layer of doc.layers) {
    if (layer.kind === "group" && layer.name === name) return layer;
  }
  return null;
}

// Ensure a named group exists at the top level. Creates it empty if
// missing and returns the group reference.
async function ensureGroup(name) {
  let g = findGroup(name);
  if (g) return g;
  const doc = app().activeDocument;
  g = await doc.createLayerGroup({ name });
  return g;
}

async function ensureAllGroups() {
  const order = [
    GROUP_NAMES.bg,
    GROUP_NAMES.frame,
    GROUP_NAMES.title,
    GROUP_NAMES.image,
    GROUP_NAMES.body,
    GROUP_NAMES.footer,
    GROUP_NAMES.globalFx,
  ];
  const out = {};
  for (const n of order) {
    out[n] = await ensureGroup(n);
  }
  return out;
}

async function clearGroup(name) {
  const g = findGroup(name);
  if (!g) return;
  // Delete all children, keep the group itself.
  const children = [...g.layers];
  for (const c of children) {
    await c.delete();
  }
}

module.exports = {
  createDocument,
  findGroup,
  ensureGroup,
  ensureAllGroups,
  clearGroup,
  // exposed for other core modules
  _ps: ps,
  _core: core,
  _app: app,
  _action: action,
};

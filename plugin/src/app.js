/*
 * Noisecore Dreamlog — app.js
 *
 * Orchestrator: owns the global state, builds the UI sections, and
 * runs the Create Card / Update Existing / Export flows.
 */

const { defaultPreset, PresetManager } = require("./core/presetManager.js");
const { computeLayout } = require("./core/layoutEngine.js");
const { createDocument, ensureAllGroups, clearGroup, findGroup } = require("./core/docManager.js");
const { buildBackground, buildOuterFrame, buildImageFrame, buildDivider } = require("./core/layerBuilder.js");
const { buildTitle, buildBody, buildFooter } = require("./core/textBuilder.js");
const { placeImageInFrame } = require("./core/imageBuilder.js");
const { buildImageFx, buildGlobalFx } = require("./core/fxBuilder.js");
const { GROUP_NAMES } = require("./utils/constants.js");

const documentPanel   = require("./ui/documentPanel.js");
const contentPanel    = require("./ui/contentPanel.js");
const typographyPanel = require("./ui/typographyPanel.js");
const colorsPanel     = require("./ui/colorsPanel.js");
const layoutPanel     = require("./ui/layoutPanel.js");
const glowPanel       = require("./ui/glowPanel.js");
const crtPanel        = require("./ui/crtPanel.js");
const exportPanel     = require("./ui/exportPanel.js");
const presetsPanel    = require("./ui/presetsPanel.js");

// Tiny event bus so panels can notify the app without coupling.
function makeBus() {
  const listeners = {};
  return {
    on(event, cb)  { if (!listeners[event]) listeners[event] = []; listeners[event].push(cb); },
    emit(event, x) { (listeners[event] || []).forEach((cb) => cb(x)); },
  };
}

const state = defaultPreset();
state.image = { entry: null, token: null, name: null, replaceOnUpdate: false };
state.document.createNew = true;
state.document.useCurrent = false;

const presetManager = new PresetManager();
const bus = makeBus();

let sectionsRoot = null;
let statusEl = null;

function setStatus(msg) {
  if (!statusEl) statusEl = document.getElementById("load-status");
  if (!statusEl) return;
  statusEl.textContent = msg || "";
}

function renderAllPanels() {
  if (!sectionsRoot) return;
  sectionsRoot.innerHTML = "";
  sectionsRoot.appendChild(documentPanel.build(state, bus));
  sectionsRoot.appendChild(contentPanel.build(state, bus));
  sectionsRoot.appendChild(typographyPanel.build(state, bus));
  sectionsRoot.appendChild(colorsPanel.build(state, bus));
  sectionsRoot.appendChild(layoutPanel.build(state, bus));
  sectionsRoot.appendChild(glowPanel.build(state, bus));
  sectionsRoot.appendChild(crtPanel.build(state, bus));
  sectionsRoot.appendChild(exportPanel.build(state, bus));
  sectionsRoot.appendChild(presetsPanel.build(state, bus, presetManager));
}

function init(root) {
  sectionsRoot = root;
  renderAllPanels();

  bus.on("preset.load", (p) => {
    // Replace every known key but keep image picker info.
    const image = state.image;
    for (const k of Object.keys(p)) state[k] = p[k];
    state.image = image;
    renderAllPanels();
    setStatus(`Loaded preset "${p.name}"`);
  });

  bus.on("preset.saved",   (name) => setStatus(`Saved preset "${name}"`));
  bus.on("preset.deleted", (name) => setStatus(`Deleted preset "${name}"`));
  bus.on("status", setStatus);

  setStatus("Ready.");
}

// --------------------------------------------------------------------
// Create Card flow
// --------------------------------------------------------------------

async function createCard() {
  try {
    setStatus("Building card…");

    const ps = require("photoshop");

    // 1. Target document.
    if (state.document.createNew || !ps.app.activeDocument) {
      await createDocument(state.document.width, state.document.height, "Noisecore Dreamlog");
    } else if (state.document.useCurrent) {
      // Leave active document as-is; the layout will just be drawn on top.
    }

    // 2. Compute layout once.
    const layout = computeLayout(state);
    if (layout.warnings.length) {
      setStatus("Layout warnings: " + layout.warnings.join(" "));
    }

    // 3. Build everything inside a single modal transaction.
    var stepErrors = [];
    await ps.core.executeAsModal(
      async () => {
        await ensureAllGroups();

        try { await buildBackground(layout, state); } catch (e) { stepErrors.push("BG: " + e.message); }
        try { await buildOuterFrame(layout, state); } catch (e) { stepErrors.push("Frame: " + e.message); }
        try { await buildTitle(layout, state); } catch (e) { stepErrors.push("Title: " + e.message); }
        try { await buildImageFrame(layout, state); } catch (e) { stepErrors.push("ImgFrame: " + e.message); }
        if (state.image.token) {
          try { await placeImageInFrame(layout, state, state.image.token); } catch (e) { stepErrors.push("Image: " + e.message); }
        }
        try { await buildImageFx(layout, state); } catch (e) { stepErrors.push("ImgFx: " + e.message); }
        try { await buildBody(layout, state); } catch (e) { stepErrors.push("Body: " + e.message); }
        try { await buildDivider(layout, state); } catch (e) { stepErrors.push("Divider: " + e.message); }
        try { await buildFooter(layout, state); } catch (e) { stepErrors.push("Footer: " + e.message); }
        try { await buildGlobalFx(layout, state); } catch (e) { stepErrors.push("GlobalFx: " + e.message); }
      },
      { commandName: "Build Noisecore card" }
    );

    if (stepErrors.length) {
      setStatus("Card built with errors: " + stepErrors.join("; "));
    } else {
      setStatus("Card built.");
    }
  } catch (e) {
    console.error(e);
    setStatus("Create failed: " + (e && e.message ? e.message : String(e)));
  }
}

// --------------------------------------------------------------------
// Update Existing Card flow
// --------------------------------------------------------------------

async function updateExistingCard() {
  try {
    setStatus("Updating existing card…");

    const ps = require("photoshop");
    if (!ps.app.activeDocument) {
      setStatus("No active document to update.");
      return;
    }

    const layout = computeLayout(state);

    var stepErrors = [];
    await ps.core.executeAsModal(
      async () => {
        for (const g of Object.values(GROUP_NAMES)) {
          if (findGroup(g)) await clearGroup(g);
        }

        await ensureAllGroups();

        try { await buildBackground(layout, state); } catch (e) { stepErrors.push("BG: " + e.message); }
        try { await buildOuterFrame(layout, state); } catch (e) { stepErrors.push("Frame: " + e.message); }
        try { await buildTitle(layout, state); } catch (e) { stepErrors.push("Title: " + e.message); }
        try { await buildImageFrame(layout, state); } catch (e) { stepErrors.push("ImgFrame: " + e.message); }
        if (state.image.token) {
          try { await placeImageInFrame(layout, state, state.image.token); } catch (e) { stepErrors.push("Image: " + e.message); }
        }
        try { await buildImageFx(layout, state); } catch (e) { stepErrors.push("ImgFx: " + e.message); }
        try { await buildBody(layout, state); } catch (e) { stepErrors.push("Body: " + e.message); }
        try { await buildDivider(layout, state); } catch (e) { stepErrors.push("Divider: " + e.message); }
        try { await buildFooter(layout, state); } catch (e) { stepErrors.push("Footer: " + e.message); }
        try { await buildGlobalFx(layout, state); } catch (e) { stepErrors.push("GlobalFx: " + e.message); }
      },
      { commandName: "Update Noisecore card" }
    );

    if (stepErrors.length) {
      setStatus("Updated with errors: " + stepErrors.join("; "));
    } else {
      setStatus("Card updated.");
    }
  } catch (e) {
    console.error(e);
    setStatus("Update failed: " + (e && e.message ? e.message : String(e)));
  }
}

module.exports = {
  init,
  createCard,
  updateExistingCard,
};

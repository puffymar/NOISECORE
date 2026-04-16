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

  // Status line at the very bottom of the scroll area.
  if (!statusEl) {
    statusEl = document.createElement("div");
    statusEl.className = "status-line";
  }
  sectionsRoot.appendChild(statusEl);
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
    await ps.core.executeAsModal(
      async () => {
        await ensureAllGroups();

        await buildBackground(layout, state);
        await buildOuterFrame(layout, state);
        await buildTitle(layout, state);
        await buildImageFrame(layout, state);
        if (state.image.token) {
          await placeImageInFrame(layout, state, state.image.token);
        }
        await buildImageFx(layout, state);
        await buildBody(layout, state);
        await buildDivider(layout, state);
        await buildFooter(layout, state);
        await buildGlobalFx(layout, state);
      },
      { commandName: "Build Noisecore card" }
    );

    setStatus("Card built.");
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

    await ps.core.executeAsModal(
      async () => {
        // Clear only the groups the plugin owns, then rebuild them.
        for (const g of Object.values(GROUP_NAMES)) {
          if (findGroup(g)) await clearGroup(g);
        }

        await ensureAllGroups();
        await buildBackground(layout, state);
        await buildOuterFrame(layout, state);
        await buildTitle(layout, state);
        await buildImageFrame(layout, state);
        if (state.image.token) {
          await placeImageInFrame(layout, state, state.image.token);
        }
        await buildImageFx(layout, state);
        await buildBody(layout, state);
        await buildDivider(layout, state);
        await buildFooter(layout, state);
        await buildGlobalFx(layout, state);
      },
      { commandName: "Update Noisecore card" }
    );

    setStatus("Card updated.");
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

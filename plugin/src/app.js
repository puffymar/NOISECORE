/*
 * Noisecore Dreamlog — app.js
 *
 * Owns the global state, builds the UI panel sections, and
 * exposes getState / getTestState for the renderer.
 */

var presetMgr = require("./core/presetManager.js");
var renderer  = require("./core/renderer.js");
var constants = require("./utils/constants.js");

var documentPanel   = require("./ui/documentPanel.js");
var contentPanel    = require("./ui/contentPanel.js");
var typographyPanel = require("./ui/typographyPanel.js");
var colorsPanel     = require("./ui/colorsPanel.js");
var layoutPanel     = require("./ui/layoutPanel.js");
var glowPanel       = require("./ui/glowPanel.js");
var crtPanel        = require("./ui/crtPanel.js");
var exportPanel     = require("./ui/exportPanel.js");
var presetsPanel    = require("./ui/presetsPanel.js");

function makeBus() {
  var listeners = {};
  return {
    on: function (event, cb) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
    },
    emit: function (event, x) {
      (listeners[event] || []).forEach(function (cb) { cb(x); });
    },
  };
}

var state = presetMgr.defaultPreset();
state.image = { entry: null, token: null, name: null, replaceOnUpdate: false };
state.document.createNew = true;
state.document.useCurrent = false;

var presetManager = new presetMgr.PresetManager();
var bus = makeBus();

var sectionsRoot = null;
var statusEl = null;

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

  bus.on("preset.load", function (p) {
    var image = state.image;
    for (var k in p) {
      if (p.hasOwnProperty(k)) state[k] = p[k];
    }
    state.image = image;
    renderAllPanels();
    setStatus("Loaded preset: " + p.name);
  });

  bus.on("preset.saved",   function (name) { setStatus("Saved preset: " + name); });
  bus.on("preset.deleted", function (name) { setStatus("Deleted preset: " + name); });
  bus.on("status", setStatus);

  setStatus("Ready.");
}

function getState() {
  return state;
}

function getTestState() {
  var ts = presetMgr.defaultPreset();
  ts.document.createNew = true;
  ts.document.width = 1080;
  ts.document.height = 1350;
  ts.title.text = renderer.TEST_CONTENT.title;
  ts.body.text = renderer.TEST_CONTENT.paragraph;
  ts.footer.leftText  = renderer.TEST_CONTENT.footerLeft;
  ts.footer.slashText = renderer.TEST_CONTENT.footerSlash;
  ts.footer.rightText = renderer.TEST_CONTENT.footerRight;
  ts.image = { entry: null, token: null, name: null };
  return ts;
}

module.exports = {
  init,
  getState,
  getTestState,
  setStatus,
};

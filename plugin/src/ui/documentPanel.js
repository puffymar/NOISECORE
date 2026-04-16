/*
 * Noisecore Dreamlog — documentPanel.js
 * Section 1 — Document controls.
 */

const { section, selectField, numberField, toggleField } = require("./_controls.js");
const { PRESETS } = require("../utils/constants.js");

function build(state, bus) {
  const presetOptions = Object.keys(PRESETS).map((k) => ({ value: k, label: PRESETS[k].label }));

  return section("Document", [
    selectField("Preset", presetOptions, state.document.preset, (v) => {
      state.document.preset = v;
      const p = PRESETS[v];
      if (v !== "custom") {
        state.document.width = p.width;
        state.document.height = p.height;
      }
      bus.emit("document.changed");
    }),
    numberField("Width",  state.document.width,  64, 8192, 1, (v) => {
      state.document.width = v;
      state.document.preset = "custom";
      bus.emit("document.changed");
    }),
    numberField("Height", state.document.height, 64, 8192, 1, (v) => {
      state.document.height = v;
      state.document.preset = "custom";
      bus.emit("document.changed");
    }),
    toggleField("Create new document on Create Card", state.document.createNew, (v) => {
      state.document.createNew = v;
    }),
    toggleField("Use current document",               state.document.useCurrent, (v) => {
      state.document.useCurrent = v;
      if (v) state.document.createNew = false;
    }),
  ]);
}

module.exports = { build };

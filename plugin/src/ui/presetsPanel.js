/*
 * Noisecore Dreamlog — presetsPanel.js
 * Section 9 — Presets.
 */

const { section, selectField, buttonField, textField } = require("./_controls.js");

function build(state, bus, presetManager) {
  const names = presetManager.list();
  const options = names.map((n) => ({ value: n, label: n }));
  let newName = state.preset?.lastSavedName || "My Preset";

  return section("Presets", [
    selectField("Load preset", options, names[0], (v) => {
      const p = presetManager.get(v);
      if (p) bus.emit("preset.load", p);
    }),
    textField("New preset name", newName, (v) => { newName = v; }),
    buttonField("Save preset", () => {
      presetManager.save(newName, state);
      bus.emit("preset.saved", newName);
    }),
    buttonField("Delete preset", () => {
      presetManager.delete(newName);
      bus.emit("preset.deleted", newName);
    }, "secondary"),
    buttonField("Reset to Noisecore Dreamlog", () => {
      const p = presetManager.resetDefault();
      bus.emit("preset.load", p);
    }, "secondary"),
  ]);
}

module.exports = { build };

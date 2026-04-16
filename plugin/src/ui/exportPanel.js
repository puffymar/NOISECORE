/*
 * Noisecore Dreamlog — exportPanel.js
 * Section 8 — Export.
 */

const { section, buttonField, textField } = require("./_controls.js");
const { pickFolder, exportImage } = require("../core/exportManager.js");

function build(state, bus) {
  const setStatus = (msg) => bus.emit("status", msg);

  return section("Export", [
    buttonField("Pick export folder…", async () => {
      try {
        const folder = await pickFolder();
        if (folder) {
          state.export.folder = folder;
          state.export.folderName = folder.name;
          setStatus(`Export folder: ${folder.name}`);
        }
      } catch (e) {
        setStatus(`Folder pick failed: ${e.message}`);
      }
    }),
    textField("Naming template", state.export.nameTemplate, (v) => { state.export.nameTemplate = v; }),
    buttonField("Export PNG", async () => {
      try {
        const name = await exportImage(state.export.folder, state.export.nameTemplate, "png");
        setStatus(`Exported ${name}`);
      } catch (e) { setStatus(`PNG export failed: ${e.message}`); }
    }),
    buttonField("Export JPG", async () => {
      try {
        const name = await exportImage(state.export.folder, state.export.nameTemplate, "jpg");
        setStatus(`Exported ${name}`);
      } catch (e) { setStatus(`JPG export failed: ${e.message}`); }
    }),
    buttonField("Export PSD copy", async () => {
      try {
        const name = await exportImage(state.export.folder, state.export.nameTemplate, "psd");
        setStatus(`Exported ${name}`);
      } catch (e) { setStatus(`PSD export failed: ${e.message}`); }
    }, "secondary"),
  ], true);
}

module.exports = { build };

/*
 * Noisecore Dreamlog — contentPanel.js
 * Section 2 — Content (title, body, footer right, image picker).
 */

const { section, textField, textareaField, buttonField } = require("./_controls.js");

function build(state, bus) {
  return section("Content", [
    textField("Title", state.title.text, (v) => { state.title.text = v; }),
    textareaField("Paragraph", state.body.text, (v) => { state.body.text = v; }),
    textField("Footer right label", state.footer.rightText, (v) => { state.footer.rightText = v; }),
    buttonField("Pick image…", async () => {
      try {
        const uxp = require("uxp");
        const lfs = uxp.storage.localFileSystem;
        const entry = await lfs.getFileForOpening({ types: ["png", "jpg", "jpeg", "webp", "tif", "tiff"] });
        if (!entry) return;
        state.image.entry = entry;
        state.image.token = await lfs.createSessionToken(entry);
        state.image.name = entry.name;
        bus.emit("content.changed");
      } catch (e) {
        console.error("Pick image failed", e);
      }
    }),
    buttonField("Replace existing image", () => {
      state.image.replaceOnUpdate = true;
    }, "secondary"),
  ]);
}

module.exports = { build };

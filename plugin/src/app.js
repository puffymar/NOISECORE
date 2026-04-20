const { DEFAULT_STATE, BUILTIN_PRESETS } = require("./defaults");
const {
  savePresets,
  loadPresets,
  pickImageFile,
  exportConfigJson,
  importConfigJson
} = require("./storage");
const { runModal, createDreamlogDocument, rebuildActiveDreamlog } = require("./photoshop");
const { $, readStateFromUI, writeStateToUI, setStatus, fillPresetSelect } = require("./renderer");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validate(state) {
  if (!state.content.title) return "Title is required.";
  if (!state.content.body) return "Body text is required.";
  if (state.doc.width < 256 || state.doc.height < 256) return "Document dimensions are too small.";
  if (state.doc.resolution < 72) return "Resolution must be 72 or above.";
  return "";
}

async function createApp() {
  let state = clone(DEFAULT_STATE);
  let userPresets = await loadPresets();

  const allPresets = () => ({ ...BUILTIN_PRESETS, ...userPresets });
  const refreshPresetUI = () => fillPresetSelect(Object.keys(allPresets()));

  refreshPresetUI();
  writeStateToUI(state);

  $("pickImage").addEventListener("click", async () => {
    try {
      const file = await pickImageFile();
      if (!file) return;
      state.image = { token: await file.createSessionToken(), nativePath: file.nativePath, name: file.name };
      writeStateToUI(state);
      setStatus(`Image selected: ${file.name}`);
    } catch (error) {
      setStatus(`Image selection failed: ${error.message}`);
    }
  });

  $("createCard").addEventListener("click", async () => {
    state = readStateFromUI(state);
    const issue = validate(state);
    if (issue) {
      setStatus(issue);
      return;
    }
    try {
      await runModal("Create Noisecore Dreamlog", async () => {
        await createDreamlogDocument(state);
      });
      setStatus("Dreamlog card created.");
    } catch (error) {
      setStatus(`Create failed: ${error.message}`);
    }
  });

  $("updateCard").addEventListener("click", async () => {
    state = readStateFromUI(state);
    const issue = validate(state);
    if (issue) {
      setStatus(issue);
      return;
    }
    try {
      await runModal("Regenerate Noisecore Dreamlog", async () => {
        await rebuildActiveDreamlog(state);
      });
      setStatus("Active card regenerated.");
    } catch (error) {
      setStatus(`Regenerate failed: ${error.message}`);
    }
  });

  $("exportJson").addEventListener("click", async () => {
    state = readStateFromUI(state);
    const file = await exportConfigJson(state);
    if (!file) {
      setStatus("Export canceled.");
      return;
    }
    setStatus(`Exported configuration to ${file.name}.`);
  });

  $("importJson").addEventListener("click", async () => {
    const imported = await importConfigJson();
    if (!imported) {
      setStatus("Import canceled or invalid JSON.");
      return;
    }
    state = {
      ...clone(DEFAULT_STATE),
      ...imported,
      doc: { ...DEFAULT_STATE.doc, ...(imported.doc || {}) },
      content: { ...DEFAULT_STATE.content, ...(imported.content || {}) },
      fx: { ...DEFAULT_STATE.fx, ...(imported.fx || {}) },
      colors: { ...DEFAULT_STATE.colors, ...(imported.colors || {}) },
      image: imported.image || { token: null, name: "" }
    };
    writeStateToUI(state);
    setStatus("Imported configuration JSON.");
  });

  $("loadPreset").addEventListener("click", () => {
    const name = $("presetSelect").value;
    const preset = allPresets()[name];
    if (!preset) {
      setStatus("Preset not found.");
      return;
    }
    state = clone(preset);
    writeStateToUI(state);
    setStatus(`Loaded preset: ${name}.`);
  });

  $("savePreset").addEventListener("click", async () => {
    state = readStateFromUI(state);
    const key = `Custom ${new Date().toISOString().slice(0, 19)}`;
    userPresets[key] = clone(state);
    await savePresets(userPresets);
    refreshPresetUI();
    $("presetSelect").value = key;
    setStatus(`Saved preset: ${key}.`);
  });
}

module.exports = { createApp };

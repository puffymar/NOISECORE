const { DEFAULT_STATE, BUILTIN_PRESETS, TEMPLATE_PRESETS } = require("./defaults");
const {
  savePresets,
  loadPresets,
  pickImageFile,
  exportConfigJson,
  importConfigJson
} = require("./storage");
const { runModal, createDreamlogDocument, rebuildActiveDreamlog, createDreamlogVariants } = require("./photoshop");
const { createRenderer } = require("./renderer");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function applyTemplate(state) {
  const preset = TEMPLATE_PRESETS[state.template];
  if (!preset) return state;
  return {
    ...state,
    colors: { ...state.colors, ...preset.colors },
    layout: { ...state.layout, ...preset.layout }
  };
}

function validate(state) {
  if (!state.content.title) return "Title is required.";
  if (!state.content.body) return "Body text is required.";
  if (state.doc.width < 256 || state.doc.height < 256) return "Document dimensions are too small.";
  if (state.doc.resolution < 72) return "Resolution must be 72 or above.";
  return "";
}

async function createApp(root) {
  const ui = createRenderer(root);
  let state = clone(DEFAULT_STATE);
  let userPresets = await loadPresets();

  const allPresets = () => ({ ...BUILTIN_PRESETS, ...userPresets });
  const refreshPresetUI = () => ui.fillPresetSelect(Object.keys(allPresets()));

  ui.fillTemplateSelect(Object.entries(TEMPLATE_PRESETS).map(([key, item]) => [key, item.label]));
  refreshPresetUI();
  ui.writeStateToUI(state);

  ui.$("template").addEventListener("change", () => {
    state = applyTemplate(ui.readStateFromUI(state));
    ui.writeStateToUI(state);
    ui.setStatus(`Template applied: ${TEMPLATE_PRESETS[state.template].label}`);
  });

  ui.$("randomSeed").addEventListener("click", () => {
    state = ui.readStateFromUI(state);
    state.fx.grainSeed = Math.floor(Math.random() * 9999) + 1;
    ui.writeStateToUI(state);
    ui.setStatus(`Random grain seed: ${state.fx.grainSeed}`);
  });

  ui.$("pickImage").addEventListener("click", async () => {
    try {
      const file = await pickImageFile();
      if (!file) return;
      state.image = { token: await file.createSessionToken(), name: file.name };
      ui.writeStateToUI(state);
      ui.setStatus(`Image selected: ${file.name}`);
    } catch (error) {
      ui.setStatus(`Image selection failed: ${error.message}`);
    }
  });

  ui.$("createCard").addEventListener("click", async () => {
    state = applyTemplate(ui.readStateFromUI(state));
    const issue = validate(state);
    if (issue) {
      ui.setStatus(issue);
      return;
    }
    try {
      await runModal("Create Noisecore Dreamlog", async () => {
        await createDreamlogDocument(state);
      });
      ui.setStatus("Dreamlog card created.");
    } catch (error) {
      ui.setStatus(`Create failed: ${error.message}`);
    }
  });

  ui.$("createVariants").addEventListener("click", async () => {
    state = applyTemplate(ui.readStateFromUI(state));
    const issue = validate(state);
    if (issue) {
      ui.setStatus(issue);
      return;
    }
    try {
      await runModal("Create Noisecore Variants", async () => {
        await createDreamlogVariants(state, 3);
      });
      ui.setStatus("Created 3 style variants.");
    } catch (error) {
      ui.setStatus(`Variant generation failed: ${error.message}`);
    }
  });

  ui.$("updateCard").addEventListener("click", async () => {
    state = applyTemplate(ui.readStateFromUI(state));
    const issue = validate(state);
    if (issue) {
      ui.setStatus(issue);
      return;
    }
    try {
      await runModal("Regenerate Noisecore Dreamlog", async () => {
        await rebuildActiveDreamlog(state);
      });
      ui.setStatus("Active card regenerated.");
    } catch (error) {
      ui.setStatus(`Regenerate failed: ${error.message}`);
    }
  });

  ui.$("exportJson").addEventListener("click", async () => {
    state = applyTemplate(ui.readStateFromUI(state));
    const file = await exportConfigJson(state);
    if (!file) {
      ui.setStatus("Export canceled.");
      return;
    }
    ui.setStatus(`Exported configuration to ${file.name}.`);
  });

  ui.$("importJson").addEventListener("click", async () => {
    const imported = await importConfigJson();
    if (!imported) {
      ui.setStatus("Import canceled or invalid JSON.");
      return;
    }
    state = {
      ...clone(DEFAULT_STATE),
      ...imported,
      doc: { ...DEFAULT_STATE.doc, ...(imported.doc || {}) },
      content: { ...DEFAULT_STATE.content, ...(imported.content || {}) },
      typography: { ...DEFAULT_STATE.typography, ...(imported.typography || {}) },
      layout: { ...DEFAULT_STATE.layout, ...(imported.layout || {}) },
      fx: { ...DEFAULT_STATE.fx, ...(imported.fx || {}) },
      colors: { ...DEFAULT_STATE.colors, ...(imported.colors || {}) },
      image: imported.image || { token: null, name: "" }
    };
    ui.writeStateToUI(state);
    ui.setStatus("Imported configuration JSON.");
  });

  ui.$("loadPreset").addEventListener("click", () => {
    const name = ui.$("presetSelect").value;
    const preset = allPresets()[name];
    if (!preset) {
      ui.setStatus("Preset not found.");
      return;
    }
    state = clone(preset);
    ui.writeStateToUI(state);
    ui.setStatus(`Loaded preset: ${name}.`);
  });

  ui.$("savePreset").addEventListener("click", async () => {
    state = applyTemplate(ui.readStateFromUI(state));
    const key = `Custom ${new Date().toISOString().slice(0, 19)}`;
    userPresets[key] = clone(state);
    await savePresets(userPresets);
    refreshPresetUI();
    ui.$("presetSelect").value = key;
    ui.setStatus(`Saved preset: ${key}.`);
  });
}

module.exports = { createApp };

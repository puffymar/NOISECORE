const { localFileSystem } = require("uxp").storage;

async function readJsonFile(file) {
  try {
    const content = await file.read();
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

async function writeJsonFile(folder, filename, value) {
  const file = await folder.createFile(filename, { overwrite: true });
  await file.write(JSON.stringify(value, null, 2));
  return file;
}

async function savePresets(presets) {
  const folder = await localFileSystem.getDataFolder();
  await writeJsonFile(folder, "presets.json", presets);
}

async function loadPresets() {
  const folder = await localFileSystem.getDataFolder();
  const entries = await folder.getEntries();
  const file = entries.find((entry) => entry.name === "presets.json");
  if (!file) return {};
  return (await readJsonFile(file)) || {};
}

async function pickImageFile() {
  return localFileSystem.getFileForOpening({ types: ["jpg", "jpeg", "png", "webp", "tif", "tiff"] });
}

async function exportConfigJson(state) {
  const folder = await localFileSystem.getFolder();
  if (!folder) return null;
  return writeJsonFile(folder, "dreamlog-config.json", state);
}

async function importConfigJson() {
  const file = await localFileSystem.getFileForOpening({ types: ["json"] });
  if (!file) return null;
  return readJsonFile(file);
}

module.exports = {
  savePresets,
  loadPresets,
  pickImageFile,
  exportConfigJson,
  importConfigJson
};

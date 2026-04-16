/*
 * Noisecore Dreamlog — exportManager.js
 *
 * Save-As operations for the current active document.
 *
 * Uses UXP storage.localFileSystem to let the user pick an output
 * folder, then saveAs with PNG/JPG format descriptors.
 */

const { _app: psApp, _action: psAction, _core: psCore } = require("./docManager.js");

const batchPlay = (...args) => psAction().batchPlay(...args);

async function getStorage() {
  const uxp = require("uxp");
  return uxp.storage.localFileSystem;
}

async function pickFolder() {
  const lfs = await getStorage();
  return await lfs.getFolder();
}

async function exportImage(folder, baseName, format) {
  if (!folder) throw new Error("No export folder selected");
  const doc = psApp().activeDocument;
  if (!doc) throw new Error("No active document to export");

  const ext = format === "jpg" ? "jpg" : format === "psd" ? "psd" : "png";
  const filename = `${baseName || "noisecore-dreamlog"}.${ext}`;
  const fileEntry = await folder.createFile(filename, { overwrite: true });
  const token = await (await getStorage()).createSessionToken(fileEntry);

  await psCore().executeAsModal(
    async () => {
      if (ext === "png") {
        await batchPlay(
          [
            {
              _obj: "save",
              as: { _obj: "PNGFormat", compression: 6, interlace: { _enum: "interlaceType", _value: "none" } },
              in: { _path: token, _kind: "local" },
              copy: true,
              lowerCase: true,
            },
          ],
          {}
        );
      } else if (ext === "jpg") {
        await batchPlay(
          [
            {
              _obj: "save",
              as: { _obj: "JPEG", extendedQuality: 10, matteColor: { _enum: "matteColor", _value: "none" } },
              in: { _path: token, _kind: "local" },
              copy: true,
              lowerCase: true,
            },
          ],
          {}
        );
      } else {
        // PSD copy
        await batchPlay(
          [
            {
              _obj: "save",
              as: { _obj: "photoshop35Format", maximizeCompatibility: true },
              in: { _path: token, _kind: "local" },
              copy: true,
              lowerCase: true,
            },
          ],
          {}
        );
      }
    },
    { commandName: "Export Noisecore card" }
  );

  return filename;
}

module.exports = { pickFolder, exportImage };

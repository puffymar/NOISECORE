/*
 * Noisecore Dreamlog — entry point
 *
 * Wrapped in try/catch so load errors surface in the panel itself
 * (since UDT Debug may not open).
 */

const statusEl = document.getElementById("load-status");

function showError(msg) {
  if (statusEl) statusEl.textContent = "ERROR: " + msg;
  console.error("Noisecore load error:", msg);
}

try {
  statusEl.textContent = "Requiring app…";
  const app = require("./src/app.js");
  statusEl.textContent = "App loaded, wiring…";

  // Wire buttons — guard against null in case DOM isn't ready.
  const btnCreate = document.getElementById("btn-create-card");
  const btnUpdate = document.getElementById("btn-update-card");

  if (btnCreate) {
    btnCreate.addEventListener("click", () => app.createCard());
  } else {
    showError("btn-create-card not found in DOM");
  }

  if (btnUpdate) {
    btnUpdate.addEventListener("click", () => app.updateExistingCard());
  } else {
    showError("btn-update-card not found in DOM");
  }

  // Init the panel sections.
  const sections = document.getElementById("sections");
  if (sections) {
    app.init(sections);
    statusEl.textContent = "Ready.";
  } else {
    showError("#sections not found in DOM");
  }
} catch (e) {
  showError(String(e && e.stack ? e.stack : e));
}

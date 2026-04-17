/*
 * Noisecore Dreamlog — entry point
 *
 * Wires DOM buttons to the staged renderer.
 */

var statusEl = document.getElementById("load-status");

function showError(msg) {
  if (statusEl) statusEl.textContent = "ERROR: " + msg;
  console.error("Noisecore load error:", msg);
}

try {
  statusEl.textContent = "Requiring modules...";

  var app = require("./src/app.js");
  var renderer = require("./src/core/renderer.js");
  var logger = require("./src/core/logger.js");

  // Set up log panel
  var logPanel = document.getElementById("log-panel");
  if (logPanel) logger.setLogEl(logPanel);

  statusEl.textContent = "Wiring buttons...";

  // Debug / Safe mode toggles
  var chkDebug = document.getElementById("chk-debug");
  var chkSafe  = document.getElementById("chk-safe");

  function getOpts(extra) {
    var opts = {
      debugMode: chkDebug ? chkDebug.checked : false,
      safeMode:  chkSafe  ? chkSafe.checked  : false,
    };
    if (extra) {
      for (var k in extra) opts[k] = extra[k];
    }
    return opts;
  }

  // Create Card — uses user's panel settings
  var btnCreate = document.getElementById("btn-create-card");
  if (btnCreate) {
    btnCreate.addEventListener("click", function () {
      statusEl.textContent = "Building card...";
      renderer.generateCard(app.getState(), getOpts()).then(function (ok) {
        statusEl.textContent = ok ? "Card built." : "Card build had errors (see log).";
      }).catch(function (e) {
        showError(e.message || String(e));
      });
    });
  }

  // Render Test Card — hardcoded sample content, always debug mode
  var btnTest = document.getElementById("btn-test-card");
  if (btnTest) {
    btnTest.addEventListener("click", function () {
      statusEl.textContent = "Rendering test card...";
      var testState = app.getTestState();
      renderer.generateCard(testState, getOpts({ debugMode: true })).then(function (ok) {
        statusEl.textContent = ok ? "Test card rendered." : "Test card had errors (see log).";
      }).catch(function (e) {
        showError(e.message || String(e));
      });
    });
  }

  // Render Structure Only — no FX pass
  var btnStructure = document.getElementById("btn-structure-only");
  if (btnStructure) {
    btnStructure.addEventListener("click", function () {
      statusEl.textContent = "Rendering structure...";
      renderer.generateCard(app.getState(), getOpts({ structureOnly: true })).then(function (ok) {
        statusEl.textContent = ok ? "Structure rendered." : "Structure had errors (see log).";
      }).catch(function (e) {
        showError(e.message || String(e));
      });
    });
  }

  // Validate + Dump
  var btnValidate = document.getElementById("btn-validate");
  if (btnValidate) {
    btnValidate.addEventListener("click", function () {
      renderer.validateAndDump();
    });
  }

  var btnDump = document.getElementById("btn-dump");
  if (btnDump) {
    btnDump.addEventListener("click", function () {
      renderer.validateAndDump();
    });
  }

  // Reset Document
  var btnReset = document.getElementById("btn-reset");
  if (btnReset) {
    btnReset.addEventListener("click", function () {
      renderer.resetDocument().then(function () {
        statusEl.textContent = "Document reset.";
      });
    });
  }

  // Init panel sections
  var sections = document.getElementById("sections");
  if (sections) {
    app.init(sections);
    statusEl.textContent = "Ready. Debug mode ON by default.";
  } else {
    showError("#sections not found in DOM");
  }
} catch (e) {
  showError(String(e && e.stack ? e.stack : e));
}

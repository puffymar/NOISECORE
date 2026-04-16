/*
 * Noisecore Dreamlog — entry point
 *
 * UXP loads this script from manifest.json -> "main": "index.html" -> <script src="main.js">.
 * This file only wires the DOM and hands control to app.js.
 */

const app = require("./src/app.js");

document.addEventListener("DOMContentLoaded", () => {
  app.init(document.getElementById("sections"));
});

document.getElementById("btn-create-card").addEventListener("click", () => {
  app.createCard();
});

document.getElementById("btn-update-card").addEventListener("click", () => {
  app.updateExistingCard();
});

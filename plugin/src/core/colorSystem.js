/*
 * Noisecore Dreamlog — colorSystem.js
 *
 * Centralised color lookup. Anything that needs a color in the plugin
 * should route through here so presets can override the whole palette
 * without every module importing constants directly.
 */

const { PALETTE } = require("../utils/constants.js");
const { hexToRgb } = require("../utils/math.js");
const { normalizeHex } = require("../utils/validation.js");

class ColorSystem {
  constructor(palette) {
    this.palette = Object.assign({}, PALETTE, palette || {});
  }

  get(key) {
    return this.palette[key];
  }

  set(key, hex) {
    this.palette[key] = normalizeHex(hex);
  }

  setAll(patch) {
    for (const k of Object.keys(patch || {})) {
      if (typeof patch[k] === "string") this.palette[k] = normalizeHex(patch[k]);
    }
  }

  // Returns Photoshop-friendly {red, green, blue} (0-255 ints).
  rgb(key) {
    return hexToRgb(this.palette[key] || "#000000");
  }

  // Returns a bare hex (used when writing to layer properties).
  hex(key) {
    return this.palette[key];
  }

  reset() {
    this.palette = Object.assign({}, PALETTE);
  }

  snapshot() {
    return Object.assign({}, this.palette);
  }
}

module.exports = { ColorSystem };

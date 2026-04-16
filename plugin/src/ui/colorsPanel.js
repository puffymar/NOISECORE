/*
 * Noisecore Dreamlog — colorsPanel.js
 * Section 4 — Colors.
 */

const { section, colorField, buttonField } = require("./_controls.js");
const { PALETTE } = require("../utils/constants.js");

function build(state, bus) {
  return section("Colors", [
    colorField("Primary glow",      state.palette.primaryGlow,     (v) => { state.palette.primaryGlow = v;  state.outerFrame.color = v; state.imageFrame.color = v; }),
    colorField("Text primary",      state.palette.textPrimary,     (v) => { state.palette.textPrimary = v; state.title.color = v; state.footer.colorLeft = v; }),
    colorField("Text secondary",    state.palette.textSecondary,   (v) => { state.palette.textSecondary = v; state.body.color = v; }),
    colorField("Background dark",   state.palette.nearBlack,       (v) => { state.palette.nearBlack = v; state.background.solid = v; }),
    colorField("Background accent", state.palette.deepMaroon,      (v) => { state.palette.deepMaroon = v; state.background.gradient = v; }),
    colorField("Divider",           state.palette.divider,         (v) => { state.palette.divider = v; state.divider.color = v; }),
    colorField("Image frame",       state.palette.primaryGlow,     (v) => { state.imageFrame.color = v; }),
    buttonField("Reset palette", () => {
      Object.assign(state.palette, PALETTE);
      state.outerFrame.color = PALETTE.primaryGlow;
      state.imageFrame.color = PALETTE.primaryGlow;
      state.title.color = PALETTE.brightAccent;
      state.body.color = PALETTE.textSecondary;
      state.footer.colorLeft = PALETTE.footerLeft;
      state.footer.colorSlash = PALETTE.footerSlash;
      state.footer.colorRight = PALETTE.footerRight;
      state.background.solid = PALETTE.nearBlack;
      state.background.gradient = PALETTE.deepMaroon;
      state.divider.color = PALETTE.divider;
      bus.emit("palette.reset");
    }, "secondary"),
  ], true);
}

module.exports = { build };

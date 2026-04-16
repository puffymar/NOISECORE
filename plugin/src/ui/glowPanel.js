/*
 * Noisecore Dreamlog — glowPanel.js
 * Section 6 — Glow controls.
 */

const { section, sliderField, toggleField } = require("./_controls.js");

function build(state) {
  return section("Glow", [
    sliderField("Outer border glow strength", state.outerFrame.glowOpacity, 0, 100, 1, (v) => { state.outerFrame.glowOpacity = v; }),
    sliderField("Outer border glow size",     state.outerFrame.glowSize,    0, 100, 1, (v) => { state.outerFrame.glowSize = v; }),
    sliderField("Image frame glow strength",  state.imageFrame.glowOpacity, 0, 100, 1, (v) => { state.imageFrame.glowOpacity = v; }),
    sliderField("Image frame glow size",      state.imageFrame.glowSize,    0, 100, 1, (v) => { state.imageFrame.glowSize = v; }),
    toggleField("Text glow", state.title.glowEnabled, (v) => { state.title.glowEnabled = v; }),
    sliderField("Title glow strength",  state.title.glowStrength,  0, 100, 1, (v) => { state.title.glowStrength = v; }),
    sliderField("Footer glow strength", state.footer.glowStrength, 0, 100, 1, (v) => { state.footer.glowStrength = v; }),
  ]);
}

module.exports = { build };

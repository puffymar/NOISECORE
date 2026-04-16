/*
 * Noisecore Dreamlog — crtPanel.js
 * Section 7 — Texture / CRT.
 */

const { section, sliderField, toggleField } = require("./_controls.js");

function build(state) {
  return section("Texture / CRT", [
    toggleField("Image CRT",               state.crt.enabled,       (v) => { state.crt.enabled = v; }),
    sliderField("Image CRT intensity",     state.crt.intensity,     0, 100, 1, (v) => { state.crt.intensity = v; }),
    sliderField("Image scanline intensity",state.crt.scanlineOpacity, 0, 100, 1, (v) => { state.crt.scanlineOpacity = v; }),
    sliderField("Image film grain",        state.crt.filmGrain,     0, 100, 1, (v) => { state.crt.filmGrain = v; }),
    sliderField("Image vignette",          state.crt.imageVignette, 0, 100, 1, (v) => { state.crt.imageVignette = v; }),
    sliderField("Global grain",            state.globalFx.grain,    0, 100, 1, (v) => { state.globalFx.grain = v; }),
    sliderField("Global vignette",         state.globalFx.vignette, 0, 100, 1, (v) => { state.globalFx.vignette = v; }),
    toggleField("Dust / film specks",      state.crt.dustSpecks,    (v) => { state.crt.dustSpecks = v; }),
  ]);
}

module.exports = { build };

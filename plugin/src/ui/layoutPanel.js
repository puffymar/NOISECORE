/*
 * Noisecore Dreamlog — layoutPanel.js
 * Section 5 — Border & Layout.
 */

const { section, sliderField } = require("./_controls.js");

function build(state) {
  return section("Border & Layout", [
    sliderField("Outer border thickness", state.outerFrame.thickness, 1, 40, 1, (v) => { state.outerFrame.thickness = v; }),
    sliderField("Outer border radius",    state.outerFrame.radius,    0, 120, 1, (v) => { state.outerFrame.radius = v; }),
    sliderField("Outer inset",            state.outerFrame.inset,     0, 200, 1, (v) => { state.outerFrame.inset = v; }),
    sliderField("Image frame radius",     state.imageFrame.radius,    0, 120, 1, (v) => { state.imageFrame.radius = v; }),
    sliderField("Image frame thickness",  state.imageFrame.thickness, 0, 40, 1, (v) => { state.imageFrame.thickness = v; }),
    sliderField("Title top margin",       state.title.yOffsetFromTop, 0, 400, 1, (v) => { state.title.yOffsetFromTop = v; }),
    sliderField("Image top offset",       state.imageFrame.top,       0, 800, 1, (v) => { state.imageFrame.top = v; }),
    sliderField("Image frame width",      state.imageFrame.width,     100, 2000, 1, (v) => { state.imageFrame.width = v; }),
    sliderField("Image frame height",     state.imageFrame.height,    100, 2000, 1, (v) => { state.imageFrame.height = v; }),
    sliderField("Body side padding",      state.body.sidePadding,     0, 400, 1, (v) => { state.body.sidePadding = v; }),
    sliderField("Body top margin",        state.body.topMarginBelowImage, 0, 300, 1, (v) => { state.body.topMarginBelowImage = v; }),
    sliderField("Footer bottom margin",   state.footer.bottomMargin,  0, 300, 1, (v) => { state.footer.bottomMargin = v; }),
    sliderField("Divider margin above footer", state.divider.topMarginAboveFooter, 0, 200, 1, (v) => { state.divider.topMarginAboveFooter = v; }),
  ]);
}

module.exports = { build };

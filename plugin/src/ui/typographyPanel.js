/*
 * Noisecore Dreamlog — typographyPanel.js
 * Section 3 — Typography controls.
 */

const { section, sliderField, toggleField, textField } = require("./_controls.js");

function build(state, bus) {
  return section("Typography", [
    textField("Title font (PostScript name)", state.fonts?.title ?? "Trajan Pro", (v) => { state.fonts = state.fonts || {}; state.fonts.title = v; }),
    textField("Body font",                    state.fonts?.body  ?? "Cormorant Garamond", (v) => { state.fonts = state.fonts || {}; state.fonts.body = v; }),
    textField("Footer font",                  state.fonts?.footer?? "Trajan Pro", (v) => { state.fonts = state.fonts || {}; state.fonts.footer = v; }),

    sliderField("Title size",     state.title.fontSize,  24, 200, 1, (v) => { state.title.fontSize = v; }),
    sliderField("Body size",      state.body.fontSize,   10, 120, 1, (v) => { state.body.fontSize = v; }),
    sliderField("Footer size",    state.footer.fontSize, 10, 120, 1, (v) => { state.footer.fontSize = v; }),

    sliderField("Title tracking", state.title.tracking,  0, 200, 1, (v) => { state.title.tracking = v; }),
    sliderField("Body leading",   state.body.leading,    10, 200, 1, (v) => { state.body.leading   = v; }),
    sliderField("Footer tracking",state.footer.tracking, 0, 200, 1, (v) => { state.footer.tracking = v; }),

    toggleField("Title uppercase",  state.title.uppercase,  (v) => { state.title.uppercase = v; }),
    toggleField("Footer uppercase", state.footer.uppercase, (v) => { state.footer.uppercase = v; }),
  ], true);
}

module.exports = { build };

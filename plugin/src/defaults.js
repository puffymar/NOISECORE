const DEFAULT_STATE = {
  doc: { width: 1080, height: 1350, resolution: 300 },
  content: {
    title: "NOISECORE DREAMLOG",
    body: "A midnight card language of grain, phosphor bloom, and editorial stillness.",
    footerRight: "DREAMLOG"
  },
  image: { token: null, name: "" },
  fx: {
    glow: 55,
    crtOpacity: 24,
    crtDensity: 8,
    grainOpacity: 18,
    grainSeed: 37
  },
  colors: {
    bgA: "#120a0d",
    bgB: "#050406",
    border: "#ff5a31",
    title: "#f7eee1",
    body: "#d9c6b7",
    footer: "#ff8a5f"
  }
};

const BUILTIN_PRESETS = {
  "Noisecore Dreamlog": DEFAULT_STATE,
  "Soft Bronze": {
    ...DEFAULT_STATE,
    colors: { ...DEFAULT_STATE.colors, border: "#d29663", footer: "#d9b083" },
    fx: { ...DEFAULT_STATE.fx, glow: 40, grainOpacity: 12 }
  },
  "Cold Crimson": {
    ...DEFAULT_STATE,
    colors: { ...DEFAULT_STATE.colors, bgA: "#160709", bgB: "#020204", border: "#c1373b" },
    fx: { ...DEFAULT_STATE.fx, crtOpacity: 18 }
  },
  "Heavy CRT": {
    ...DEFAULT_STATE,
    fx: { ...DEFAULT_STATE.fx, crtOpacity: 48, crtDensity: 14, grainOpacity: 34 }
  }
};

module.exports = { DEFAULT_STATE, BUILTIN_PRESETS };

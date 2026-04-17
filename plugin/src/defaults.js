const TEMPLATE_PRESETS = {
  classic: {
    label: "Classic Dreamlog",
    colors: {
      bgA: "#120a0d",
      bgB: "#050406",
      border: "#ff5a31",
      title: "#f7eee1",
      body: "#d9c6b7",
      footer: "#ff8a5f"
    }
  },
  cold: {
    label: "Cold Crimson",
    colors: {
      bgA: "#160709",
      bgB: "#020204",
      border: "#c1373b",
      title: "#f5ebea",
      body: "#d5c0c3",
      footer: "#d26f76"
    }
  },
  bronze: {
    label: "Soft Bronze",
    colors: {
      bgA: "#1a1210",
      bgB: "#060504",
      border: "#d29663",
      title: "#f4e8db",
      body: "#d7c0aa",
      footer: "#d9b083"
    }
  }
};

const DEFAULT_STATE = {
  template: "classic",
  doc: { width: 1080, height: 1350, resolution: 300 },
  content: {
    title: "NOISECORE DREAMLOG",
    body: "A midnight card language of grain, phosphor bloom, and editorial stillness.",
    footerRight: "DREAMLOG"
  },
  typography: {
    titleFont: "TrajanPro-Regular",
    bodyFont: "CormorantGaramond-Regular",
    footerFont: "Cinzel-Regular",
    titleSize: 86,
    bodySize: 35,
    footerSize: 31
  },
  image: { token: null, name: "" },
  fx: {
    glow: 55,
    crtOpacity: 24,
    crtDensity: 8,
    grainOpacity: 18,
    grainSeed: 37,
    titleGlowOpacity: 40,
    titleGlowBlur: 24,
    titleGlowEnabled: true
  },
  colors: { ...TEMPLATE_PRESETS.classic.colors }
};

const BUILTIN_PRESETS = {
  "Noisecore Dreamlog": DEFAULT_STATE,
  "Heavy CRT": {
    ...DEFAULT_STATE,
    fx: { ...DEFAULT_STATE.fx, crtOpacity: 48, crtDensity: 14, grainOpacity: 34 }
  },
  "Text Glow Focus": {
    ...DEFAULT_STATE,
    fx: { ...DEFAULT_STATE.fx, titleGlowOpacity: 70, titleGlowBlur: 36 },
    typography: { ...DEFAULT_STATE.typography, titleSize: 92 }
  }
};

module.exports = { DEFAULT_STATE, BUILTIN_PRESETS, TEMPLATE_PRESETS };

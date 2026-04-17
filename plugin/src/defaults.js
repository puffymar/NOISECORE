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
    },
    layout: { titleY: 156, bodyY: 968, footerY: 1220, imageY: 290, imageH: 560, marginX: 96 }
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
    },
    layout: { titleY: 150, bodyY: 960, footerY: 1210, imageY: 274, imageH: 580, marginX: 92 }
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
    },
    layout: { titleY: 166, bodyY: 980, footerY: 1234, imageY: 300, imageH: 540, marginX: 100 }
  },
  poster: {
    label: "Poster Vertical",
    colors: {
      bgA: "#0d0a12",
      bgB: "#030306",
      border: "#8d63ff",
      title: "#f1ebff",
      body: "#cbbde7",
      footer: "#a98cdf"
    },
    layout: { titleY: 138, bodyY: 1036, footerY: 1262, imageY: 242, imageH: 700, marginX: 84 }
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
    footerSize: 31,
    tracking: 40
  },
  layout: { ...TEMPLATE_PRESETS.classic.layout },
  image: { token: null, name: "" },
  fx: {
    glow: 55,
    crtOpacity: 24,
    crtDensity: 8,
    grainOpacity: 18,
    grainSeed: 37,
    titleGlowOpacity: 40,
    titleGlowBlur: 24,
    titleGlowEnabled: true,
    textCrtOpacity: 20,
    vignetteOpacity: 28
  },
  colors: { ...TEMPLATE_PRESETS.classic.colors }
};

const BUILTIN_PRESETS = {
  "Noisecore Dreamlog": DEFAULT_STATE,
  "Heavy CRT": {
    ...DEFAULT_STATE,
    fx: { ...DEFAULT_STATE.fx, crtOpacity: 56, crtDensity: 14, grainOpacity: 36, textCrtOpacity: 35 }
  },
  "Text Glow Focus": {
    ...DEFAULT_STATE,
    fx: { ...DEFAULT_STATE.fx, titleGlowOpacity: 72, titleGlowBlur: 38 },
    typography: { ...DEFAULT_STATE.typography, titleSize: 94, tracking: 90 }
  },
  "Poster Vertical": {
    ...DEFAULT_STATE,
    template: "poster",
    colors: { ...TEMPLATE_PRESETS.poster.colors },
    layout: { ...TEMPLATE_PRESETS.poster.layout },
    typography: { ...DEFAULT_STATE.typography, titleSize: 96, bodySize: 31 }
  }
};

module.exports = { DEFAULT_STATE, BUILTIN_PRESETS, TEMPLATE_PRESETS };

/*
 * Noisecore Dreamlog — constants.js
 *
 * Single source of truth for default values. Every default here is taken
 * directly from the spec so the layout engine, UI, and preset system all
 * point at the same numbers.
 */

const PRESETS = {
  instagram_portrait: { label: "Instagram Portrait", width: 1080, height: 1350 },
  story_reel:        { label: "Story / Reel",        width: 1080, height: 1920 },
  custom:            { label: "Custom",              width: 1080, height: 1350 },
};

const DEFAULT_PRESET_KEY = "instagram_portrait";

const PALETTE = {
  primaryGlow:     "#FF5A2A",
  brightAccent:    "#F2552C",
  secondaryOrange: "#D96A3A",
  mutedBronze:     "#8A7447",
  deepMaroon:      "#190407",
  nearBlack:       "#090203",
  divider:         "#E14E26",
  textPrimary:     "#F2552C",
  textSecondary:   "#E86A38",
  footerLeft:      "#F2552C",
  footerSlash:     "#D96A3A",
  footerRight:     "#8D7347",
  imageFrame:      "#FF5A2A",
};

const FONTS = {
  titleStack:  ["TrajanPro-Regular", "Trajan Pro", "Cinzel-Regular", "Cinzel", "CormorantSC-Regular", "Cormorant SC", "Georgia"],
  bodyStack:   ["CormorantGaramond-Regular", "Cormorant Garamond", "EBGaramond-Regular", "EB Garamond", "Georgia"],
  footerStack: ["TrajanPro-Regular", "Trajan Pro", "Cinzel-Regular", "Cinzel", "Georgia"],
};

// All numeric defaults are given for the reference canvas 1080x1350.
// layoutEngine.js scales them proportionally for other canvas sizes.
const REFERENCE = { width: 1080, height: 1350 };

const DEFAULTS = {
  outerFrame: {
    inset: 50,
    thickness: 5,
    radius: 38,
    color: PALETTE.primaryGlow,
    glowOpacity: 72,
    glowSize: 24,
    glowSpread: 4,
  },

  title: {
    text: "TITLE",
    yOffsetFromTop: 78,
    fontSize: 84,
    tracking: 24,
    leading: 92,
    color: PALETTE.brightAccent,
    uppercase: true,
    glowEnabled: true,
    glowStrength: 40,
  },

  imageFrame: {
    top: 170,
    width: 860,
    height: 470,
    radius: 26,
    thickness: 4,
    color: PALETTE.primaryGlow,
    glowOpacity: 55,
    glowSize: 16,
    fitMode: "cover", // cover | contain | smart
    offsetX: 0,
    offsetY: 0,
    scale: 1.0,
  },

  body: {
    text: "Paragraph text goes here. Enter your copy in the Content panel and it will render exactly as typed, auto-wrapped inside the safe margins.",
    topMarginBelowImage: 34,
    sidePadding: 92,
    fontSize: 31,
    leading: 42,
    tracking: 0,
    color: PALETTE.textSecondary,
    autoFit: true,
  },

  divider: {
    width: 860,
    thickness: 3,
    topMarginAboveFooter: 28,
    color: PALETTE.divider,
    glowStrength: 30,
  },

  footer: {
    leftText: "NOISECORE",
    slashText: "//",
    rightText: "DREAMLOG",
    fontSize: 38,
    tracking: 30,
    spacing: 14,
    bottomMargin: 58,
    uppercase: true,
    colorLeft:  PALETTE.footerLeft,
    colorSlash: PALETTE.footerSlash,
    colorRight: PALETTE.footerRight,
    glowStrength: 20,
  },

  background: {
    solid:    PALETTE.nearBlack,
    gradient: PALETTE.deepMaroon,
    grainAmount: 22,
    grainBlendMode: "softLight", // overlay | softLight | screen
    vignetteOpacity: 28,
  },

  crt: {
    enabled: true,
    intensity: 30,
    scanlineOpacity: 14,
    filmGrain: 18,
    imageVignette: 18,
    dustSpecks: false,
  },

  globalFx: {
    grain: 8,
    vignette: 10,
    colorWash: 0,
  },

  export: {
    folder: null,
    nameTemplate: "copycat-noisecore-v1",
    format: "png",
  },
};

// Group names used to organize Photoshop layers. Everything the plugin
// creates or touches should live under one of these groups so Update
// Existing Card can find them again.
const GROUP_NAMES = {
  bg:        "BG",
  frame:     "Outer Frame",
  title:     "Title",
  image:     "Image Frame",
  body:      "Body Copy",
  footer:    "Footer",
  globalFx:  "Global FX",
};

// Specific layer names inside each group. Keep these stable.
const LAYER_NAMES = {
  bgSolid:        "BG Solid",
  bgGradient:     "BG Gradient",
  bgGrain:        "BG Grain",
  bgVignette:     "BG Vignette",

  outerBorderStroke: "Outer Border Stroke",
  outerBorderGlow:   "Outer Border Glow",

  titleText: "Title Text",
  titleGlow: "Title Glow",

  imageMaskShape: "Image Mask Shape",
  placedImage:    "Placed Image",
  imageBorder:    "Image Border",
  imageGlow:      "Image Glow",
  crtOverlay:     "CRT Overlay",
  filmGrainOverlay: "Film Grain Overlay",
  imageVignette:  "Image Vignette",

  paragraphText: "Paragraph Text",

  dividerLine: "Divider Line",
  footerLeft:  "Footer Left",
  footerSlash: "Footer Slash",
  footerRight: "Footer Right",

  globalGrain:    "Global Grain",
  globalColorWash:"Global Color Wash",
  globalVignette: "Global Vignette",
};

module.exports = {
  PRESETS,
  DEFAULT_PRESET_KEY,
  PALETTE,
  FONTS,
  REFERENCE,
  DEFAULTS,
  GROUP_NAMES,
  LAYER_NAMES,
};

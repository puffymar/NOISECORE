/*
 * Noisecore Dreamlog — presetManager.js
 *
 * In-memory preset store. v1 ships four built-in presets and supports
 * runtime save/load. On-disk persistence (writing presets to the UXP
 * data folder) is a v2 TODO and stubbed below.
 */

const { DEFAULTS, PALETTE } = require("../utils/constants.js");

function deepClone(x) { return JSON.parse(JSON.stringify(x)); }

function defaultPreset() {
  return {
    name: "Noisecore Dreamlog",
    document: { preset: "instagram_portrait", width: 1080, height: 1350 },
    palette: deepClone(PALETTE),
    outerFrame: deepClone(DEFAULTS.outerFrame),
    title: deepClone(DEFAULTS.title),
    imageFrame: deepClone(DEFAULTS.imageFrame),
    body: deepClone(DEFAULTS.body),
    divider: deepClone(DEFAULTS.divider),
    footer: deepClone(DEFAULTS.footer),
    background: deepClone(DEFAULTS.background),
    crt: deepClone(DEFAULTS.crt),
    globalFx: deepClone(DEFAULTS.globalFx),
    export: deepClone(DEFAULTS.export),
  };
}

function softBronzePreset() {
  const p = defaultPreset();
  p.name = "Soft Bronze";
  p.palette.primaryGlow = "#D98A3A";
  p.palette.brightAccent = "#C87035";
  p.palette.textPrimary = "#C87035";
  p.palette.textSecondary = "#B87040";
  p.outerFrame.color = "#D98A3A";
  p.outerFrame.glowOpacity = 55;
  p.crt.intensity = 18;
  p.crt.filmGrain = 12;
  return p;
}

function coldCrimsonPreset() {
  const p = defaultPreset();
  p.name = "Cold Crimson";
  p.palette.primaryGlow = "#C8102E";
  p.palette.brightAccent = "#C8102E";
  p.palette.textPrimary = "#C8102E";
  p.palette.textSecondary = "#A0101F";
  p.palette.deepMaroon = "#0A0104";
  p.palette.nearBlack = "#050102";
  p.background.solid = "#050102";
  p.background.gradient = "#0A0104";
  p.crt.filmGrain = 24;
  return p;
}

function heavyCrtPreset() {
  const p = defaultPreset();
  p.name = "Heavy CRT";
  p.crt.intensity = 75;
  p.crt.scanlineOpacity = 32;
  p.crt.filmGrain = 40;
  p.crt.imageVignette = 38;
  p.globalFx.grain = 20;
  p.globalFx.vignette = 22;
  return p;
}

const BUILT_IN = [
  defaultPreset(),
  softBronzePreset(),
  coldCrimsonPreset(),
  heavyCrtPreset(),
];

class PresetManager {
  constructor() {
    this.presets = BUILT_IN.map(deepClone);
  }

  list() {
    return this.presets.map((p) => p.name);
  }

  get(name) {
    const found = this.presets.find((p) => p.name === name);
    return found ? deepClone(found) : null;
  }

  save(name, state) {
    const copy = deepClone(state);
    copy.name = name;
    const idx = this.presets.findIndex((p) => p.name === name);
    if (idx >= 0) this.presets[idx] = copy;
    else this.presets.push(copy);
  }

  delete(name) {
    this.presets = this.presets.filter((p) => p.name !== name);
  }

  resetDefault() {
    return deepClone(defaultPreset());
  }

  // v2 TODO: persist presets to ${uxp.storage.localFileSystem.dataFolder}/presets.json
  async persist() { /* no-op for v1 */ }
  async loadPersisted() { /* no-op for v1 */ }
}

module.exports = { PresetManager, defaultPreset };

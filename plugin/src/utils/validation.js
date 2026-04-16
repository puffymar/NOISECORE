/*
 * Noisecore Dreamlog — validation.js
 *
 * Guard rails for user input. Returns a { ok, value, error } shape so the
 * UI layer can surface the first failure without throwing.
 */

function validHex(s) {
  return typeof s === "string" && /^#?[0-9a-fA-F]{6}$/.test(s.trim());
}

function normalizeHex(s) {
  const t = s.trim();
  return t.startsWith("#") ? t.toUpperCase() : ("#" + t).toUpperCase();
}

function intInRange(v, lo, hi, name) {
  const n = Number(v);
  if (!Number.isFinite(n)) return { ok: false, error: `${name} must be a number` };
  if (n < lo || n > hi) return { ok: false, error: `${name} must be between ${lo} and ${hi}` };
  return { ok: true, value: Math.round(n) };
}

function validCanvas(width, height) {
  const w = intInRange(width,  64, 8192, "Width");
  if (!w.ok) return w;
  const h = intInRange(height, 64, 8192, "Height");
  if (!h.ok) return h;
  return { ok: true, value: { width: w.value, height: h.value } };
}

function validRequiredString(s, name) {
  if (typeof s !== "string" || s.trim().length === 0) {
    return { ok: false, error: `${name} is required` };
  }
  return { ok: true, value: s };
}

module.exports = {
  validHex,
  normalizeHex,
  intInRange,
  validCanvas,
  validRequiredString,
};

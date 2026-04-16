/*
 * Noisecore Dreamlog — math.js
 *
 * Small numeric helpers. No Photoshop API references allowed here.
 */

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Scale a reference value (tuned for 1080x1350) to an arbitrary canvas
// using the average of x/y scale factors so both dimensions move it.
function scaleToCanvas(value, ref, actual) {
  const sx = actual.width / ref.width;
  const sy = actual.height / ref.height;
  return value * ((sx + sy) / 2);
}

// Same but returns an integer, for pixel coordinates.
function scaleToCanvasPx(value, ref, actual) {
  return Math.round(scaleToCanvas(value, ref, actual));
}

// Fit a (sw, sh) image inside a (dw, dh) frame with the given mode.
// Returns {x, y, w, h} in frame-local coordinates.
function fitImage(sw, sh, dw, dh, mode) {
  if (sw <= 0 || sh <= 0) return { x: 0, y: 0, w: dw, h: dh };
  const sr = sw / sh;
  const dr = dw / dh;
  if (mode === "contain") {
    if (sr > dr) {
      const w = dw;
      const h = dw / sr;
      return { x: 0, y: (dh - h) / 2, w, h };
    } else {
      const h = dh;
      const w = dh * sr;
      return { x: (dw - w) / 2, y: 0, w, h };
    }
  }
  // cover / smart (smart falls back to cover for now)
  if (sr > dr) {
    const h = dh;
    const w = dh * sr;
    return { x: (dw - w) / 2, y: 0, w, h };
  } else {
    const w = dw;
    const h = dw / sr;
    return { x: 0, y: (dh - h) / 2, w, h };
  }
}

function hexToRgb(hex) {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return {
    red:   (n >> 16) & 255,
    green: (n >> 8)  & 255,
    blue:   n        & 255,
  };
}

function rgbToHex({ red, green, blue }) {
  const h = (n) => n.toString(16).padStart(2, "0");
  return "#" + h(red) + h(green) + h(blue);
}

module.exports = {
  clamp,
  lerp,
  scaleToCanvas,
  scaleToCanvasPx,
  fitImage,
  hexToRgb,
  rgbToHex,
};

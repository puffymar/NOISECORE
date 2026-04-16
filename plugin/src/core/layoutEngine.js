/*
 * Noisecore Dreamlog — layoutEngine.js
 *
 * Pure function: takes the current state (canvas size + all settings)
 * and returns a fully-resolved layout object with absolute pixel
 * coordinates for every element. Layer/text/image/FX builders consume
 * this and never do their own math.
 *
 * This module never touches Photoshop APIs.
 */

const { REFERENCE } = require("../utils/constants.js");
const { scaleToCanvasPx } = require("../utils/math.js");

// Scale a set of spec fields that are measured in reference pixels.
function s(value, ref, actual) {
  return scaleToCanvasPx(value, ref, actual);
}

function computeLayout(state) {
  const canvas = { width: state.document.width, height: state.document.height };
  const ref = REFERENCE;

  // --- Outer frame ----------------------------------------------------
  const of = state.outerFrame;
  const inset     = s(of.inset, ref, canvas);
  const thickness = s(of.thickness, ref, canvas);
  const radius    = s(of.radius, ref, canvas);
  const frame = {
    x: inset,
    y: inset,
    width:  canvas.width  - inset * 2,
    height: canvas.height - inset * 2,
    thickness,
    radius,
  };

  // --- Title ----------------------------------------------------------
  const t = state.title;
  const titleY = inset + s(t.yOffsetFromTop, ref, canvas);
  const title = {
    x: canvas.width / 2,
    y: titleY,
    fontSize: s(t.fontSize, ref, canvas),
    tracking: t.tracking,
    leading: s(t.leading || t.fontSize * 1.1, ref, canvas),
    text: t.uppercase ? (t.text || "").toUpperCase() : (t.text || ""),
  };

  // --- Image frame ----------------------------------------------------
  const img = state.imageFrame;
  const imgWidth  = s(img.width,  ref, canvas);
  const imgHeight = s(img.height, ref, canvas);
  const imageFrame = {
    x: Math.round((canvas.width - imgWidth) / 2),
    y: s(img.top, ref, canvas),
    width:  imgWidth,
    height: imgHeight,
    radius: s(img.radius, ref, canvas),
    thickness: s(img.thickness, ref, canvas),
  };

  // --- Body copy ------------------------------------------------------
  const body = state.body;
  const bodyY = imageFrame.y + imageFrame.height + s(body.topMarginBelowImage, ref, canvas);
  const bodySidePad = s(body.sidePadding, ref, canvas);
  const bodyBlock = {
    x: bodySidePad,
    y: bodyY,
    width: canvas.width - bodySidePad * 2,
    fontSize: s(body.fontSize, ref, canvas),
    leading:  s(body.leading,  ref, canvas),
    tracking: body.tracking,
  };

  // --- Footer ---------------------------------------------------------
  const f = state.footer;
  const footerFontSize = s(f.fontSize, ref, canvas);
  const footerBottomMargin = s(f.bottomMargin, ref, canvas);
  const footerY = canvas.height - footerBottomMargin - footerFontSize;
  const footer = {
    y: footerY,
    fontSize: footerFontSize,
    tracking: f.tracking,
    spacing: s(f.spacing, ref, canvas),
    centerX: canvas.width / 2,
  };

  // --- Divider --------------------------------------------------------
  const d = state.divider;
  const dividerWidth = s(d.width, ref, canvas);
  const dividerY = footerY - s(d.topMarginAboveFooter, ref, canvas);
  const divider = {
    x: Math.round((canvas.width - dividerWidth) / 2),
    y: dividerY,
    width: dividerWidth,
    thickness: s(d.thickness, ref, canvas),
  };

  // --- Collision check (soft warnings, not fatal) ---------------------
  const warnings = [];
  if (bodyBlock.y >= dividerY) {
    warnings.push("Body copy overlaps divider — reduce body text or shrink image frame.");
  }
  if (imageFrame.y < title.y + title.fontSize) {
    warnings.push("Image frame overlaps title — lower image frame top or reduce title size.");
  }
  if (dividerY < bodyBlock.y + bodyBlock.fontSize * 2) {
    warnings.push("Very little space between body and divider.");
  }

  return {
    canvas,
    frame,
    title,
    imageFrame,
    body: bodyBlock,
    divider,
    footer,
    warnings,
  };
}

// Small helper used by UI previews.
function bodyMaxLines(layout) {
  const available = layout.divider.y - layout.body.y;
  return Math.max(1, Math.floor(available / Math.max(1, layout.body.leading)));
}

module.exports = { computeLayout, bodyMaxLines };

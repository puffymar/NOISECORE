/*
 * Noisecore Dreamlog — imageBuilder.js
 *
 * Places the user's image inside the Image Frame group and clips it
 * to the Image Mask Shape so the rounded corners survive.
 *
 * v1: uses file placement via the "placeEvent" action descriptor and
 * fits the placed smart object into the frame using cover/contain math
 * from utils/math.js.
 */

const { _app: psApp, _action: psAction, ensureGroup, findGroup } = require("./docManager.js");
const { LAYER_NAMES, GROUP_NAMES } = require("../utils/constants.js");
const { fitImage } = require("../utils/math.js");

const batchPlay = (...args) => psAction().batchPlay(...args);

async function placeImageInFrame(layout, state, imageToken) {
  if (!imageToken) return; // no image picked yet — leave frame empty

  const group = await ensureGroup(GROUP_NAMES.image);
  const frame = layout.imageFrame;

  // Place the file as a smart object. imageToken is a UXP session token
  // from storage.localFileSystem.getFileForOpening (or createSessionToken
  // on an existing entry).
  await batchPlay(
    [
      {
        _obj: "placeEvent",
        null: { _path: imageToken, _kind: "local" },
        freeTransformCenterState: { _enum: "quadCenterState", _value: "QCSAverage" },
        offset: { _obj: "offset", horizontal: { _unit: "pixelsUnit", _value: 0 }, vertical: { _unit: "pixelsUnit", _value: 0 } },
      },
    ],
    {}
  );

  const doc = psApp().activeDocument;
  const placed = doc.activeLayers[0];
  if (!placed) return;
  placed.name = LAYER_NAMES.placedImage;

  // Measure placed bounds, then scale + translate to cover the frame.
  const b = placed.bounds;
  const sw = b.right - b.left;
  const sh = b.bottom - b.top;
  const fit = fitImage(sw, sh, frame.width, frame.height, state.imageFrame.fitMode);

  const scaleX = (fit.w / sw) * 100;
  const scaleY = (fit.h / sh) * 100;

  // Transform: scale around top-left of current bounds.
  await batchPlay(
    [
      {
        _obj: "transform",
        _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
        freeTransformCenterState: { _enum: "quadCenterState", _value: "QCSIndependent" },
        position: {
          _obj: "position",
          horizontal: { _unit: "pixelsUnit", _value: frame.x + fit.x + state.imageFrame.offsetX },
          vertical:   { _unit: "pixelsUnit", _value: frame.y + fit.y + state.imageFrame.offsetY },
        },
        width:  { _unit: "percentUnit", _value: scaleX * (state.imageFrame.scale || 1) },
        height: { _unit: "percentUnit", _value: scaleY * (state.imageFrame.scale || 1) },
        interfaceIconFrameDimmed: { _enum: "interpolationType", _value: "bicubicSharper" },
      },
    ],
    {}
  );

  // Move into the Image Frame group and clip to the mask shape below.
  await placed.move(group, "placeInside");

  // Create a clipping mask so the placed image follows the rounded rect.
  await batchPlay(
    [
      { _obj: "select", _target: [{ _ref: "layer", _name: LAYER_NAMES.placedImage }] },
      { _obj: "groupEvent", _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }] },
    ],
    {}
  );
}

module.exports = { placeImageInFrame };

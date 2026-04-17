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

var docMgr = require("./docManager.js");
var constants = require("../utils/constants.js");
var math = require("../utils/math.js");

function batchPlay(desc, opts) {
  return docMgr._action().batchPlay(desc, opts || {});
}

async function placeImageInFrame(layout, state, imageToken) {
  if (!imageToken) return;

  var group = await docMgr.ensureGroup(constants.GROUP_NAMES.image);
  var frame = layout.imageFrame;

  // Place the file as a smart object via placeEvent
  await batchPlay([
    {
      _obj: "placeEvent",
      null: { _path: imageToken, _kind: "local" },
      freeTransformCenterState: { _enum: "quadCenterState", _value: "QCSAverage" },
      offset: {
        _obj: "offset",
        horizontal: { _unit: "pixelsUnit", _value: 0 },
        vertical: { _unit: "pixelsUnit", _value: 0 },
      },
    },
  ]);

  // Rename the placed layer
  await batchPlay([
    {
      _obj: "set",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      to: { _obj: "layer", name: constants.LAYER_NAMES.placedImage },
    },
  ]);

  // Read placed bounds from the active layer
  var doc = docMgr._app().activeDocument;
  var placed = doc.activeLayers[0];
  if (!placed) return;

  var b = placed.bounds;
  var sw = b.right - b.left;
  var sh = b.bottom - b.top;
  var fit = math.fitImage(sw, sh, frame.width, frame.height, state.imageFrame.fitMode);

  var scaleX = (fit.w / sw) * 100;
  var scaleY = (fit.h / sh) * 100;

  // Transform: scale and position to cover the frame
  await batchPlay([
    {
      _obj: "transform",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
      freeTransformCenterState: { _enum: "quadCenterState", _value: "QCSIndependent" },
      position: {
        _obj: "position",
        horizontal: { _unit: "pixelsUnit", _value: frame.x + fit.x + (state.imageFrame.offsetX || 0) },
        vertical:   { _unit: "pixelsUnit", _value: frame.y + fit.y + (state.imageFrame.offsetY || 0) },
      },
      width:  { _unit: "percentUnit", _value: scaleX * (state.imageFrame.scale || 1) },
      height: { _unit: "percentUnit", _value: scaleY * (state.imageFrame.scale || 1) },
      interfaceIconFrameDimmed: { _enum: "interpolationType", _value: "bicubicSharper" },
    },
  ]);

  // Move into group using batchPlay (DOM .move is unreliable)
  await docMgr.moveActiveLayerIntoGroup(group);

  // Create a clipping mask so the image follows the rounded rect mask shape
  await batchPlay([
    {
      _obj: "groupEvent",
      _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
    },
  ]);
}

module.exports = { placeImageInFrame };

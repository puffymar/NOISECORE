function $(id) {
  return document.getElementById(id);
}

function readStateFromUI(state) {
  return {
    ...state,
    doc: {
      width: Number($("docWidth").value),
      height: Number($("docHeight").value),
      resolution: Number($("docResolution").value)
    },
    content: {
      title: $("title").value.trim(),
      body: $("body").value.trim(),
      footerRight: $("footerRight").value.trim()
    },
    fx: {
      glow: Number($("glow").value),
      crtOpacity: Number($("crtOpacity").value),
      crtDensity: Number($("crtDensity").value),
      grainOpacity: Number($("grainOpacity").value),
      grainSeed: Number($("grainSeed").value)
    }
  };
}

function writeStateToUI(state) {
  $("docWidth").value = state.doc.width;
  $("docHeight").value = state.doc.height;
  $("docResolution").value = state.doc.resolution;

  $("title").value = state.content.title;
  $("body").value = state.content.body;
  $("footerRight").value = state.content.footerRight;

  $("glow").value = state.fx.glow;
  $("crtOpacity").value = state.fx.crtOpacity;
  $("crtDensity").value = state.fx.crtDensity;
  $("grainOpacity").value = state.fx.grainOpacity;
  $("grainSeed").value = state.fx.grainSeed;

  $("imagePath").textContent = state.image.name || "No file selected";
}

function setStatus(message) {
  $("status").textContent = message;
}

function fillPresetSelect(names) {
  const select = $("presetSelect");
  select.innerHTML = "";
  for (const name of names) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  }
}

module.exports = {
  $, readStateFromUI, writeStateToUI, setStatus, fillPresetSelect
};

function createRenderer(root) {
  function $(id) {
    return root.querySelector(`#${id}`);
  }

  function readStateFromUI(state) {
    return {
      ...state,
      template: $("template").value,
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
      typography: {
        titleFont: $("titleFont").value.trim(),
        bodyFont: $("bodyFont").value.trim(),
        footerFont: $("footerFont").value.trim(),
        titleSize: Number($("titleSize").value),
        bodySize: Number($("bodySize").value),
        footerSize: Number($("footerSize").value)
      },
      fx: {
        glow: Number($("glow").value),
        crtOpacity: Number($("crtOpacity").value),
        crtDensity: Number($("crtDensity").value),
        grainOpacity: Number($("grainOpacity").value),
        grainSeed: Number($("grainSeed").value),
        titleGlowOpacity: Number($("titleGlowOpacity").value),
        titleGlowBlur: Number($("titleGlowBlur").value),
        titleGlowEnabled: $("titleGlowEnabled").checked
      }
    };
  }

  function writeStateToUI(state) {
    $("template").value = state.template;
    $("docWidth").value = state.doc.width;
    $("docHeight").value = state.doc.height;
    $("docResolution").value = state.doc.resolution;

    $("title").value = state.content.title;
    $("body").value = state.content.body;
    $("footerRight").value = state.content.footerRight;

    $("titleFont").value = state.typography.titleFont;
    $("bodyFont").value = state.typography.bodyFont;
    $("footerFont").value = state.typography.footerFont;
    $("titleSize").value = state.typography.titleSize;
    $("bodySize").value = state.typography.bodySize;
    $("footerSize").value = state.typography.footerSize;

    $("glow").value = state.fx.glow;
    $("crtOpacity").value = state.fx.crtOpacity;
    $("crtDensity").value = state.fx.crtDensity;
    $("grainOpacity").value = state.fx.grainOpacity;
    $("grainSeed").value = state.fx.grainSeed;
    $("titleGlowOpacity").value = state.fx.titleGlowOpacity;
    $("titleGlowBlur").value = state.fx.titleGlowBlur;
    $("titleGlowEnabled").checked = !!state.fx.titleGlowEnabled;

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

  function fillTemplateSelect(templates) {
    const select = $("template");
    select.innerHTML = "";
    for (const [key, label] of templates) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = label;
      select.appendChild(option);
    }
  }

  return {
    $,
    readStateFromUI,
    writeStateToUI,
    setStatus,
    fillPresetSelect,
    fillTemplateSelect
  };
}

module.exports = { createRenderer };

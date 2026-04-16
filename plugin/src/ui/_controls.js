/*
 * Noisecore Dreamlog — _controls.js
 *
 * Helpers for building panel controls. Pure DOM, no Photoshop API.
 * Uses margins for spacing (UXP does not support CSS gap).
 */

function el(tag, attrs, children) {
  const n = document.createElement(tag);
  if (attrs) {
    for (const k of Object.keys(attrs)) {
      if (k === "class") n.className = attrs[k];
      else if (k === "style") n.setAttribute("style", attrs[k]);
      else if (k.startsWith("on") && typeof attrs[k] === "function") n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
  }
  if (children) {
    if (!Array.isArray(children)) children = [children];
    for (const c of children) {
      if (c == null) continue;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
  }
  return n;
}

function section(title, bodyChildren, startCollapsed) {
  const header = el("div", { class: "section-header" }, [
    el("h2", null, title),
    el("span", { class: "section-toggle" }, startCollapsed ? "+" : "\u2212"),
  ]);
  const body = el("div", { class: "section-body" }, bodyChildren);
  const wrap = el("div", { class: startCollapsed ? "section collapsed" : "section" }, [header, body]);
  header.addEventListener("click", function () {
    wrap.classList.toggle("collapsed");
    header.querySelector(".section-toggle").textContent = wrap.classList.contains("collapsed") ? "+" : "\u2212";
  });
  return wrap;
}

function textField(label, value, onChange) {
  var input = el("input", { type: "text", value: value || "" });
  input.addEventListener("input", function () { onChange(input.value); });
  return el("div", { class: "field" }, [el("label", null, label), input]);
}

function numberField(label, value, min, max, step, onChange) {
  var input = el("input", {
    type: "number",
    value: String(value || 0),
    min: String(min),
    max: String(max),
    step: String(step || 1),
  });
  input.addEventListener("input", function () { onChange(Number(input.value)); });
  return el("div", { class: "field" }, [el("label", null, label), input]);
}

function sliderField(label, value, min, max, step, onChange) {
  var input = el("input", {
    type: "range",
    value: String(value || 0),
    min: String(min),
    max: String(max),
    step: String(step || 1),
  });
  var readout = el("span", { class: "readout" }, String(value || 0));
  input.addEventListener("input", function () {
    readout.textContent = input.value;
    onChange(Number(input.value));
  });
  var row = el("div", { class: "row" }, [input, readout]);
  return el("div", { class: "field" }, [el("label", null, label), row]);
}

function selectField(label, options, value, onChange) {
  var sel = el("select", null, options.map(function (o) {
    var opt = el("option", { value: o.value }, o.label);
    if (o.value === value) opt.setAttribute("selected", "selected");
    return opt;
  }));
  sel.addEventListener("change", function () { onChange(sel.value); });
  return el("div", { class: "field" }, [el("label", null, label), sel]);
}

function toggleField(label, value, onChange) {
  var cb = el("input", { type: "checkbox" });
  if (value) cb.setAttribute("checked", "checked");
  cb.addEventListener("change", function () { onChange(cb.checked); });
  return el("div", { class: "field" }, [
    el("label", null, [cb, label]),
  ]);
}

function colorField(label, hex, onChange) {
  var swatch = el("span", { class: "swatch", style: "background:" + hex + ";" });
  var input = el("input", { type: "text", value: hex });
  input.addEventListener("input", function () {
    var v = input.value.trim();
    if (/^#?[0-9a-fA-F]{6}$/.test(v)) {
      if (v.charAt(0) !== "#") v = "#" + v;
      swatch.style.background = v;
      onChange(v.toUpperCase());
    }
  });
  var row = el("div", { class: "row" }, [swatch, input]);
  return el("div", { class: "field" }, [el("label", null, label), row]);
}

function textareaField(label, value, onChange) {
  var ta = el("textarea");
  ta.textContent = value || "";
  ta.value = value || "";
  ta.addEventListener("input", function () { onChange(ta.value); });
  return el("div", { class: "field" }, [el("label", null, label), ta]);
}

function buttonField(label, onClick, variant) {
  var cls = variant === "cta" ? "cta" : variant === "secondary" ? "secondary" : "";
  var b = el("button", { type: "button", class: cls }, label);
  b.addEventListener("click", onClick);
  return el("div", { class: "field" }, [b]);
}

module.exports = {
  el,
  section,
  textField,
  numberField,
  sliderField,
  selectField,
  toggleField,
  colorField,
  textareaField,
  buttonField,
};

/*
 * Noisecore Dreamlog — _controls.js
 *
 * Helpers for building panel controls. Pure DOM, no Photoshop API.
 * Every section imports this to stay consistent.
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

function section(title, bodyChildren) {
  const header = el("div", { class: "section-header" }, [
    el("h2", null, title),
    el("span", { class: "section-toggle" }, "−"),
  ]);
  const body = el("div", { class: "section-body" }, bodyChildren);
  const wrap = el("div", { class: "section" }, [header, body]);
  header.addEventListener("click", () => {
    wrap.classList.toggle("collapsed");
    header.querySelector(".section-toggle").textContent = wrap.classList.contains("collapsed") ? "+" : "−";
  });
  return wrap;
}

function textField(label, value, onChange) {
  const input = el("input", { type: "text", value: value ?? "" });
  input.addEventListener("input", () => onChange(input.value));
  return el("div", { class: "field" }, [el("label", null, label), input]);
}

function numberField(label, value, min, max, step, onChange) {
  const input = el("input", { type: "number", value: String(value ?? 0), min: String(min), max: String(max), step: String(step || 1) });
  input.addEventListener("input", () => onChange(Number(input.value)));
  return el("div", { class: "field" }, [el("label", null, label), input]);
}

function sliderField(label, value, min, max, step, onChange) {
  const input = el("input", { type: "range", value: String(value ?? 0), min: String(min), max: String(max), step: String(step || 1) });
  const readout = el("span", { class: "section-toggle" }, String(value ?? 0));
  input.addEventListener("input", () => {
    readout.textContent = input.value;
    onChange(Number(input.value));
  });
  const row = el("div", { class: "row" }, [input, readout]);
  return el("div", { class: "field" }, [el("label", null, label), row]);
}

function selectField(label, options, value, onChange) {
  const sel = el("select", null, options.map((o) => {
    const opt = el("option", { value: o.value }, o.label);
    if (o.value === value) opt.setAttribute("selected", "selected");
    return opt;
  }));
  sel.addEventListener("change", () => onChange(sel.value));
  return el("div", { class: "field" }, [el("label", null, label), sel]);
}

function toggleField(label, value, onChange) {
  const cb = el("input", { type: "checkbox" });
  if (value) cb.setAttribute("checked", "checked");
  cb.addEventListener("change", () => onChange(cb.checked));
  return el("div", { class: "field" }, [
    el("label", null, [cb, " ", label]),
  ]);
}

function colorField(label, hex, onChange) {
  const swatch = el("span", { class: "swatch", style: `background:${hex};` });
  const input = el("input", { type: "text", value: hex });
  input.addEventListener("input", () => {
    if (/^#?[0-9a-fA-F]{6}$/.test(input.value.trim())) {
      const v = input.value.trim().startsWith("#") ? input.value.trim() : "#" + input.value.trim();
      swatch.style.background = v;
      onChange(v.toUpperCase());
    }
  });
  const row = el("div", { class: "row" }, [swatch, input]);
  return el("div", { class: "field" }, [el("label", null, label), row]);
}

function textareaField(label, value, onChange) {
  const ta = el("textarea", null, value ?? "");
  ta.value = value ?? "";
  ta.addEventListener("input", () => onChange(ta.value));
  return el("div", { class: "field" }, [el("label", null, label), ta]);
}

function buttonField(label, onClick, variant) {
  const b = el("button", { type: "button" }, label);
  b.addEventListener("click", onClick);
  if (variant === "secondary") b.style.opacity = "0.8";
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

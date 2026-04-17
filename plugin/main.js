const { entrypoints } = require("uxp");

const PANEL_HTML = `
<div class="noisecore-panel" style="padding:12px; font-family:Arial, sans-serif; color:#f4ebdf; background:#101014; min-height:100%;">
  <h1 style="margin:0 0 6px; font-size:18px;">Noisecore Dreamlog</h1>
  <p style="margin:0 0 12px; color:#b9a99e;">Comprehensive composition builder</p>

  <section style="background:#181820; border:1px solid #2b2b36; border-radius:8px; padding:10px; margin-bottom:10px;">
    <h2 style="margin:0 0 8px; font-size:13px; color:#e8d3c4;">Template</h2>
    <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Start Template
      <select id="template"></select>
    </label>
  </section>

  <section style="background:#181820; border:1px solid #2b2b36; border-radius:8px; padding:10px; margin-bottom:10px;">
    <h2 style="margin:0 0 8px; font-size:13px; color:#e8d3c4;">Document</h2>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Width <input id="docWidth" type="number" min="256" value="1080" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Height <input id="docHeight" type="number" min="256" value="1350" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Resolution <input id="docResolution" type="number" min="72" value="300" /></label>
    </div>
  </section>

  <section style="background:#181820; border:1px solid #2b2b36; border-radius:8px; padding:10px; margin-bottom:10px;">
    <h2 style="margin:0 0 8px; font-size:13px; color:#e8d3c4;">Content</h2>
    <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; margin-bottom:8px;">Title <input id="title" type="text" /></label>
    <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; margin-bottom:8px;">Body <textarea id="body" style="min-height:84px;"></textarea></label>
    <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Footer Right <input id="footerRight" type="text" /></label>
  </section>

  <section style="background:#181820; border:1px solid #2b2b36; border-radius:8px; padding:10px; margin-bottom:10px;">
    <h2 style="margin:0 0 8px; font-size:13px; color:#e8d3c4;">Typography</h2>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Title Font <input id="titleFont" type="text" value="TrajanPro-Regular" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Body Font <input id="bodyFont" type="text" value="CormorantGaramond-Regular" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Footer Font <input id="footerFont" type="text" value="Cinzel-Regular" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Title Size <input id="titleSize" type="number" min="8" value="86" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Body Size <input id="bodySize" type="number" min="8" value="35" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Footer Size <input id="footerSize" type="number" min="8" value="31" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Tracking <input id="tracking" type="number" min="0" value="40" /></label>
    </div>
  </section>

  <section style="background:#181820; border:1px solid #2b2b36; border-radius:8px; padding:10px; margin-bottom:10px;">
    <h2 style="margin:0 0 8px; font-size:13px; color:#e8d3c4;">Layout</h2>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Title Y <input id="titleY" type="number" value="156" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Image Y <input id="imageY" type="number" value="290" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Image Height <input id="imageH" type="number" value="560" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Body Y <input id="bodyY" type="number" value="968" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Footer Y <input id="footerY" type="number" value="1220" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Horizontal Margin <input id="marginX" type="number" value="96" /></label>
    </div>
  </section>

  <section style="background:#181820; border:1px solid #2b2b36; border-radius:8px; padding:10px; margin-bottom:10px;">
    <h2 style="margin:0 0 8px; font-size:13px; color:#e8d3c4;">Colors</h2>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Background A <input id="bgA" type="color" value="#120a0d" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Background B <input id="bgB" type="color" value="#050406" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Border <input id="borderColor" type="color" value="#ff5a31" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Title <input id="titleColor" type="color" value="#f7eee1" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Body <input id="bodyColor" type="color" value="#d9c6b7" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Footer <input id="footerColor" type="color" value="#ff8a5f" /></label>
    </div>
  </section>

  <section style="background:#181820; border:1px solid #2b2b36; border-radius:8px; padding:10px; margin-bottom:10px;">
    <h2 style="margin:0 0 8px; font-size:13px; color:#e8d3c4;">Image</h2>
    <div style="display:flex; gap:8px; align-items:center;">
      <button id="pickImage">Pick Image</button>
      <span id="imagePath" style="font-size:11px; color:#b9a99e;">No file selected</span>
    </div>
  </section>

  <section style="background:#181820; border:1px solid #2b2b36; border-radius:8px; padding:10px; margin-bottom:10px;">
    <h2 style="margin:0 0 8px; font-size:13px; color:#e8d3c4;">FX</h2>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Glow <input id="glow" type="range" min="0" max="100" value="55" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">CRT Opacity <input id="crtOpacity" type="range" min="0" max="100" value="24" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">CRT Density <input id="crtDensity" type="range" min="2" max="16" value="8" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Grain Opacity <input id="grainOpacity" type="range" min="0" max="100" value="18" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Grain Seed <input id="grainSeed" type="number" min="1" value="37" /></label>
      <button id="randomSeed" type="button">Randomize Seed</button>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Title Glow Opacity <input id="titleGlowOpacity" type="range" min="0" max="100" value="40" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Title Glow Blur <input id="titleGlowBlur" type="number" min="0" value="24" /></label>
      <label style="display:flex; flex-direction:row; align-items:center; gap:8px; font-size:12px;">Enable Title Glow <input id="titleGlowEnabled" type="checkbox" checked /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Text CRT Opacity <input id="textCrtOpacity" type="range" min="0" max="100" value="20" /></label>
      <label style="display:flex; flex-direction:column; gap:6px; font-size:12px;">Vignette Opacity <input id="vignetteOpacity" type="range" min="0" max="100" value="28" /></label>
    </div>
  </section>

  <section style="background:#181820; border:1px solid #2b2b36; border-radius:8px; padding:10px; margin-bottom:10px;">
    <h2 style="margin:0 0 8px; font-size:13px; color:#e8d3c4;">Presets</h2>
    <div style="display:flex; gap:8px; align-items:center;">
      <select id="presetSelect"></select>
      <button id="loadPreset">Load</button>
      <button id="savePreset">Save Current</button>
    </div>
  </section>

  <section style="background:#181820; border:1px solid #2b2b36; border-radius:8px; padding:10px; margin-bottom:10px;">
    <h2 style="margin:0 0 8px; font-size:13px; color:#e8d3c4;">Actions</h2>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
      <button id="createCard">Create Card</button>
      <button id="createVariants">Create 3 Variants</button>
      <button id="updateCard">Regenerate Active</button>
      <button id="exportJson">Export Config JSON</button>
      <button id="importJson">Import Config JSON</button>
    </div>
  </section>

  <p id="status" style="font-size:12px; color:#b9a99e; margin:8px 2px 0;">Ready.</p>
</div>
`;

async function boot(node) {
  node.innerHTML = PANEL_HTML;
  try {
    const { createApp } = require("./src/app");
    await createApp(node);
  } catch (error) {
    const status = node.querySelector("#status");
    if (status) {
      status.textContent = `Initialization failed: ${error.message}`;
    } else {
      node.innerHTML = `<div style="padding:12px;color:#fff;background:#300;">Initialization failed: ${error.message}</div>`;
    }
  }
}

entrypoints.setup({
  panels: {
    "noisecore-dreamlog-panel": {
      async show(eventOrNode) {
        const node = eventOrNode && eventOrNode.node ? eventOrNode.node : eventOrNode;
        if (!node) return;
        if (!node.querySelector(".noisecore-panel")) {
          await boot(node);
        }
      }
    }
  }
});

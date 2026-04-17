/*
 * Noisecore Dreamlog — logger.js
 *
 * Writes to console AND to the log panel in the plugin UI.
 * Every generation step logs what it did and the bounds it produced.
 */

var logEl = null;

function setLogEl(el) { logEl = el; }

function ts() {
  var d = new Date();
  var pad = function (n) { return n < 10 ? "0" + n : String(n); };
  return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
}

function write(cssClass, message) {
  console.log("[NC] " + message);
  if (!logEl) return;
  var div = document.createElement("div");
  div.className = "log-line " + cssClass;
  div.textContent = "[" + ts() + "] " + message;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

function info(msg)    { write("log-info",    msg); }
function ok(msg)      { write("log-ok",      "OK    " + msg); }
function warn(msg)    { write("log-warn",    "WARN  " + msg); }
function fail(stage, err) {
  var emsg = err && err.message ? err.message : String(err);
  write("log-fail", "FAIL  " + stage + " -- " + emsg);
}
function stage(name)  { write("log-stage",   "=> " + name); }

function clear() { if (logEl) logEl.innerHTML = ""; }

function boundsStr(b) {
  if (!b) return "(no bounds)";
  return "x=" + Math.round(b.x) + " y=" + Math.round(b.y) +
         " w=" + Math.round(b.w) + " h=" + Math.round(b.h);
}

module.exports = { setLogEl, info, ok, warn, fail, stage, clear, boundsStr };

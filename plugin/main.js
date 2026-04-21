const { createApp } = require("./src/app");

document.addEventListener("DOMContentLoaded", () => {
  createApp().catch((error) => {
    const status = document.getElementById("status");
    if (status) status.textContent = `Initialization failed: ${error.message}`;
  });
});

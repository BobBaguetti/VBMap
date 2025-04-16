// main.js
import { initMap, loadMarkers } from "./modules/mapSetup.js";
import { initUI } from "./modules/ui.js";
import { logError } from "./modules/errorLogger.js";

document.addEventListener("DOMContentLoaded", () => {
  try {
    const map = initMap();
    loadMarkers();
    initUI();
    console.log("Application initialized successfully.");
  } catch (error) {
    logError("Error initializing the application:", error);
  }
});

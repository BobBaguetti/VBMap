// @file: src/bootstrap/events.js
// @version: 1.3 — unified ESC now also closes About, Settings, and Context Menu

import { activateFloatingScrollbars } from "../shared/utils/scrollUtils.js";
import { map } from "../appInit.js";
import { hideContextMenu } from "../modules/context-menu/hideContextMenu.js"; // close context menu

function init() {
  // 1) Floating scrollbars upon DOMContentLoaded
  document.addEventListener("DOMContentLoaded", activateFloatingScrollbars);

  // 2) Global ESC handler to close the topmost overlay
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;

    // A) Close About modal if it is open
    const aboutModal = document.getElementById("about-modal");
    if (aboutModal && !aboutModal.classList.contains("hidden")) {
      aboutModal.classList.add("hidden");
      e.preventDefault();
      return;
    }

    // B) Close Settings modal if it is open
    const settingsModal = document.getElementById("settings-modal");
    if (settingsModal && !settingsModal.classList.contains("hidden")) {
      settingsModal.classList.add("hidden");
      e.preventDefault();
      return;
    }

    // C) Close any open context menu if visible
    const contextMenu = document.getElementById("context-menu");
    if (contextMenu && contextMenu.style.display === "block") {
      hideContextMenu();
      e.preventDefault();
      return;
    }

    // D) Close any open Leaflet popup
    const openPopup = document.querySelector(".leaflet-popup");
    if (openPopup) {
      map.closePopup();
      e.preventDefault();
      return;
    }

    // E) Close search suggestions if visible
    const suggestionsList = document.querySelector("#search-suggestions");
    const searchBar       = document.querySelector("#search-bar");
    if (suggestionsList && suggestionsList.classList.contains("visible")) {
      suggestionsList.classList.remove("visible");
      searchBar.value = "";
      searchBar.dispatchEvent(new Event("input", { bubbles: true }));
      searchBar.focus();
      e.preventDefault();
      return;
    }

    // If nothing was open, Esc does nothing further
  });
}

export default {
  init
};

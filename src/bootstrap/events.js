// @file: src/bootstrap/events.js
// @version: 1.2 — global ESC handler closes top‐most overlay (modals, popups, search)

import { activateFloatingScrollbars } from "../shared/utils/scrollUtils.js";
import { map } from "../appInit.js"; // Leaflet map instance used to close popups

function init() {
  // 1) Floating scrollbars upon DOMContentLoaded
  document.addEventListener("DOMContentLoaded", activateFloatingScrollbars);

  // 2) Global ESC handler to close “topmost” overlay
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;

    // A) If any modal is open, close that modal first
    //    Adjust the selector to match your modal’s “open” class or attribute
    const openModal = document.querySelector(".modal.open");
    if (openModal) {
      // If your modal has a close button inside, trigger it:
      const closeBtn = openModal.querySelector(".modal-close-btn");
      if (closeBtn) {
        closeBtn.click();
      } else {
        // Otherwise, remove the “open” class to hide the modal
        openModal.classList.remove("open");
      }
      e.preventDefault();
      return;
    }

    // B) If a Leaflet popup is open, close it
    //    Leaflet popups have class “leaflet-popup”, so we detect and close
    const openPopup = document.querySelector(".leaflet-popup");
    if (openPopup) {
      map.closePopup();
      e.preventDefault();
      return;
    }

    // C) If search suggestions are visible, hide & clear them
    const suggestionsList = document.querySelector("#search-suggestions");
    const searchBar       = document.querySelector("#search-bar");
    if (
      suggestionsList &&
      suggestionsList.classList.contains("visible")
    ) {
      suggestionsList.classList.remove("visible");
      searchBar.value = "";
      // Re‐trigger the input event to reset any filtering logic
      searchBar.dispatchEvent(new Event("input", { bubbles: true }));
      searchBar.focus();
      e.preventDefault();
      return;
    }

    // If none of the above are open, allow ESC to propagate normally
  });
}

export default {
  init
};

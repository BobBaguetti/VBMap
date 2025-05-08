// @file: /src/modules/ui/preview/chestPreview.js
// @version: 4 – now identical in-modal behaviour to item preview

import { renderChestPopup } from "../../map/markerManager.js";

export function createChestPreviewPanel(container) {
  // Reset container and apply the shared preview-frame classes
  container.className = "";
  container.classList.add("preview-panel", "chest-preview-panel");

  // Create the wrapper that centers the popup content
  const wrapper = document.createElement("div");
  wrapper.className = "preview-popup-wrapper";
  container.appendChild(wrapper);

  return {
    container,

    /**
     * @param {Object|null} def
     *   the chest definition with lootPool, name, iconUrl, etc.
     *   or null/undefined for an empty placeholder
     */
    setFromDefinition(def) {
      // If there's no definition, clear everything.
      if (!def) {
        wrapper.innerHTML = "";
      } else {
        // Generate the exact same HTML as the map popup
        wrapper.innerHTML = renderChestPopup(def);
      }
    },

    show() {
      container.classList.add("visible");
    },

    hide() {
      container.classList.remove("visible");
    }
  };
}

// @file: src/modules/definition/preview/chestPreview.js
// @version: 4.2 — render into host, no fixed positioning

import { renderChestPopup } from "../../map/markerManager.js";

export function createChestPreviewPanel(container) {
  container.classList.add("chest-preview-panel");

  const wrapper = document.createElement("div");
  wrapper.className = "preview-popup-wrapper";
  container.appendChild(wrapper);

  return {
    setFromDefinition(def) {
      if (!def) {
        wrapper.innerHTML = "";
      } else {
        // ensure renderChestPopup sees an iconUrl
        const withIcon = {
          ...def,
          iconUrl: def.imageSmall || def.imageLarge || ""
        };
        wrapper.innerHTML = renderChestPopup(withIcon);
      }
    }
  };
}

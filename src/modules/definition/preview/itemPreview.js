// @file: src/modules/definition/preview/itemPreview.js
// @version: 5.2 — render into host, no fixed positioning

import { renderItemPopup } from "../../map/markerManager.js";

export function createItemPreviewPanel(container) {
  // Apply only the item-specific styling (background/image)
  container.classList.add("item-preview-panel");

  // Wrap the popup HTML in your existing wrapper
  const popupWrapper = document.createElement("div");
  popupWrapper.className = "preview-popup-wrapper";
  container.appendChild(popupWrapper);

  return {
    setFromDefinition(def) {
      popupWrapper.innerHTML = def ? renderItemPopup(def) : "";
    }
  };
}

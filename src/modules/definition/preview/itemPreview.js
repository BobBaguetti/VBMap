// @file: src/modules/definition/preview/itemPreview.js
// @version: 5.2 — removed hard-coded container.id for consistency

import { renderItemPopup } from "../../map/markerManager.js";

export function createItemPreviewPanel(container) {
  // Use classes only; no hard-coded IDs for consistency
  container.classList.add("preview-panel", "item-preview-panel");

  const popupWrapper = document.createElement("div");
  popupWrapper.className = "preview-popup-wrapper";
  container.appendChild(popupWrapper);

  return {
    setFromDefinition(def) {
      popupWrapper.innerHTML = def ? renderItemPopup(def) : "";
    },
    show() { container.classList.add("visible"); },
    hide() { container.classList.remove("visible"); }
  };
}

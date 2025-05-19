// @file: src\modules\definition\preview\itemPreview.js
// @version: 5.1 — import renderItemPopup instead of renderPopup

import { renderItemPopup } from "../../map/markerManager.js";

export function createItemPreviewPanel(container) {
  container.id = "item-preview-panel";
  container.classList.add("preview-panel", "item-preview-panel");

  const popupWrapper = document.createElement("div");
  popupWrapper.className = "preview-popup-wrapper";
  container.appendChild(popupWrapper);

  return {
    setFromDefinition(def) {
      // use renderItemPopup for the HTML
      popupWrapper.innerHTML = def ? renderItemPopup(def) : "";
    },
    show() { container.classList.add("visible"); },
    hide() { container.classList.remove("visible"); }
  };
}

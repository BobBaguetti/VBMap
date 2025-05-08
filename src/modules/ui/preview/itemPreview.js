// @file: /src/modules/ui/preview/itemPreview.js
// @version: 5 – uses shared preview-panel CSS

import { renderPopup } from "../../map/markerManager.js";

export function createItemPreviewPanel(container) {
  container.id = "item-preview-panel";
  container.classList.add("preview-panel", "item-preview-panel");

  const popupWrapper = document.createElement("div");
  popupWrapper.className = "preview-popup-wrapper";
  container.appendChild(popupWrapper);

  return {
    setFromDefinition(def) {
      popupWrapper.innerHTML = def ? renderPopup(def) : "";
    },
    show() { container.classList.add("visible"); },
    hide() { container.classList.remove("visible"); }
  };
}

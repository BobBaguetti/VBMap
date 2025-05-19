// @file: src\modules\definition\preview\chestPreview.js
// @version: 4.1 — pick up the new image fields for the header icon

import { renderChestPopup } from "../../map/markerManager.js";

export function createChestPreviewPanel(container) {
  container.className = "preview-panel chest-preview-panel";
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
          iconUrl: def.imageSmall || def.imageLarge || "",
        };
        wrapper.innerHTML = renderChestPopup(withIcon);
      }
    },
    show() { container.classList.add("visible"); },
    hide() { container.classList.remove("visible"); }
  };
}

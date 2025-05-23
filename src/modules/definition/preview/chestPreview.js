// @file: src/modules/definition/preview/chestPreview.js
// @version: 4.2 — preserve wrapper class so old previews get removed

import { createPickr } from "../form/controller/pickrAdapter.js"; // if needed
import { renderChestPopup } from "../../map/markerManager.js";

export function createChestPreviewPanel(container) {
  // Instead of overwriting className, add these
  container.classList.add("preview-panel", "chest-preview-panel");

  // Create inner wrapper
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

// @file: src/modules/definition/preview/chestPreview.js
// @version: 4.3 — convert lootPool objects → IDs for renderChestPopup

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
        // Ensure renderChestPopup sees an iconUrl
        // and convert lootPool objects back to IDs
        const lootIds = Array.isArray(def.lootPool)
          ? def.lootPool.map(itemObj => itemObj.id)
          : [];
        const withIconAndIds = {
          ...def,
          iconUrl: def.imageSmall || def.imageLarge || "",
          lootPool: lootIds
        };
        wrapper.innerHTML = renderChestPopup(withIconAndIds);
      }
    },
    show() { container.classList.add("visible"); },
    hide() { container.classList.remove("visible"); }
  };
}

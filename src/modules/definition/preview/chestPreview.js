// @file: src/modules/definition/preview/chestPreview.js
// @version: 4.3 — pass lootPool as IDs so renderChestPopup shows inventory

import { renderChestPopup } from "../../map/markerManager.js";

export function createChestPreviewPanel(container) {
  container.classList.add("preview-panel", "chest-preview-panel");

  const wrapper = document.createElement("div");
  wrapper.className = "preview-popup-wrapper";
  container.appendChild(wrapper);

  return {
    /**
     * Populate the preview panel from the given definition.
     * @param {Object|null} def — chest definition, possibly with def.lootPool as full item‐objects
     */
    setFromDefinition(def) {
      if (!def) {
        wrapper.innerHTML = "";
        return;
      }

      // Convert the full-item objects back to just their IDs,
      // because renderChestPopup expects def.lootPool to be [ "itemId1", "itemId2", … ].
      const idOnlyDef = {
        ...def,
        lootPool: Array.isArray(def.lootPool)
          ? def.lootPool.map(itemObj => itemObj.id)
          : []
      };

      // Also ensure iconUrl is passed, just like map markers do:
      const forPopup = {
        ...idOnlyDef,
        iconUrl: def.imageSmall || def.imageLarge || ""
      };

      // Now generate the exact same HTML that a live‐marker popup would use:
      wrapper.innerHTML = renderChestPopup(forPopup);
    },
    show()  { container.classList.add("visible"); },
    hide()  { container.classList.remove("visible"); }
  };
}

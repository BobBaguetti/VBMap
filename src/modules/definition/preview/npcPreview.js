// @file: src/modules/definition/preview/npcPreview.js
// @version: 1.1 — only render for existing definitions, hide for new entries

import { renderNpcPopup } from "../../map/markerManager.js";

export function createNpcPreviewPanel(container) {
  // Add the standard preview panel classes
  container.classList.add("preview-panel", "npc-preview-panel");

  // Create and append the inner wrapper for popup content
  const popupWrapper = document.createElement("div");
  popupWrapper.className = "preview-popup-wrapper";
  container.appendChild(popupWrapper);

  return {
    /**
     * Populate the preview panel from the given definition.
     * @param {Object|null} def NPC definition or null to clear.
     */
    setFromDefinition(def) {
      // Only render a preview when editing an existing NPC (has an id).
      if (!def || def.id == null) {
        popupWrapper.innerHTML = "";
      } else {
        // Ensure lootPool is at least an empty array
        const previewDef = {
          ...def,
          lootPool: Array.isArray(def.lootPool) ? def.lootPool : []
        };
        popupWrapper.innerHTML = renderNpcPopup(previewDef);
      }
    },
    /** Show the panel */
    show() { container.classList.add("visible"); },
    /** Hide the panel */
    hide() { container.classList.remove("visible"); }
  };
}

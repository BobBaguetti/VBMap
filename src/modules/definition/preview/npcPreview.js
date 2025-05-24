// @file: src/modules/definition/preview/npcPreview.js
// @version: 1.0 — NPC definition preview panel

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
      popupWrapper.innerHTML = def ? renderNpcPopup(def) : "";
    },
    /** Show the panel */
    show() { container.classList.add("visible"); },
    /** Hide the panel */
    hide() { container.classList.remove("visible"); }
  };
}

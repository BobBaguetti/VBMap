// @file: src/modules/definition/preview/npcPreview.js
// @version: 1.0 — preview panel for NPC definitions

import { renderNpcPopup } from "../../map/markerManager.js";

export function createNpcPreviewPanel(container) {
  container.classList.add("preview-panel", "npc-preview-panel");
  const wrapper = document.createElement("div");
  wrapper.className = "preview-popup-wrapper";
  container.appendChild(wrapper);

  return {
    setFromDefinition(def) {
      // Render popup HTML or clear if no definition
      wrapper.innerHTML = def ? renderNpcPopup(def) : "";
    },
    show() {
      container.classList.add("visible");
    },
    hide() {
      container.classList.remove("visible");
    }
  };
}

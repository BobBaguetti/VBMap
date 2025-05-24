// @file: src/modules/definition/preview/npcPreview.js
// @version: 1.1 — only render when def.id exists

import { renderNpcPopup } from "../../map/markerManager.js";

export function createNpcPreviewPanel(container) {
  container.classList.add("preview-panel", "npc-preview-panel");
  const wrapper = document.createElement("div");
  wrapper.className = "preview-popup-wrapper";
  container.appendChild(wrapper);

  return {
    setFromDefinition(def) {
      // Only render when a valid definition (with id) is provided
      if (!def || !def.id) {
        wrapper.innerHTML = "";
        return;
      }
      wrapper.innerHTML = renderNpcPopup(def);
    },
    show() {
      container.classList.add("visible");
    },
    hide() {
      container.classList.remove("visible");
    }
  };
}

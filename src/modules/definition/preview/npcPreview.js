// @file: src/modules/definition/preview/npcPreview.js
// @version: 1.1 — include chest preview styling

import { renderNpcPopup } from "../../map/markerManager.js";

export function createNpcPreviewPanel(container) {
  // Add both generic and chest-specific preview styles
  container.classList.add(
    "preview-panel",
    "npc-preview-panel",
    "chest-preview-panel"  // reapplies chest CSS
  );

  const popupWrapper = document.createElement("div");
  popupWrapper.className = "preview-popup-wrapper";
  container.appendChild(popupWrapper);

  return {
    setFromDefinition(def) {
      popupWrapper.innerHTML = def ? renderNpcPopup(def) : "";
    },
    show() { container.classList.add("visible"); },
    hide() { container.classList.remove("visible"); }
  };
}

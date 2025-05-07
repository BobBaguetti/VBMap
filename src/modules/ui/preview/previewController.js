// @file: src/modules/ui/preview/previewController.js
// @version: 1.0 — show/hide & position only

import { createPreviewPanel } from "./createPreviewPanel.js";

export function createPreviewController(type) {
  const container = document.createElement("div");
  container.style.zIndex = "1101";
  document.body.appendChild(container);

  const previewApi = createPreviewPanel(type, container);

  function positionAndShow(def) {
    previewApi.setFromDefinition(def);
    previewApi.show();
    const mc = document.querySelector(".modal-content")?.getBoundingClientRect();
    const pr = container.getBoundingClientRect();
    if (mc && pr.height) {
      container.style.position = "absolute";
      container.style.left     = `${mc.right + 30}px`;
      container.style.top      = `${mc.top + (mc.height/2) - (pr.height/2)}px`;
    }
  }

  return {
    show: positionAndShow,
    hide: () => previewApi.hide()
  };
}

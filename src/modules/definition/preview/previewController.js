// @file: src/modules/definition/preview/previewController.js
// @version: 1.1 — inject into host; skip absolute positioning when embedded

import { createPreviewPanel } from "./createPreviewPanel.js";

export function createPreviewController(type, host) {
  // create our own wrapper
  const container = document.createElement("div");
  container.classList.add("definition-preview-panel");
  container.style.zIndex = "1101";

  // if a host is provided, append there, otherwise to body
  const parent = host || document.body;
  parent.appendChild(container);

  const previewApi = createPreviewPanel(type, container);

  function positionAndShow(def) {
    previewApi.setFromDefinition(def);
    previewApi.show();

    // only do floating positioning if not embedded
    if (!host) {
      const mc = document.querySelector(".modal-content")?.getBoundingClientRect();
      const pr = container.getBoundingClientRect();
      if (mc && pr.height) {
        container.style.position = "absolute";
        container.style.left     = `${mc.right + 30}px`;
        container.style.top      = `${mc.top + (mc.height/2) - (pr.height/2)}px`;
      }
    }
  }

  return {
    show: positionAndShow,
    hide: () => previewApi.hide()
  };
}

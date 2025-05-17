// @file: src/modules/definition/preview/previewController.js
// @version: 1.3 — always float preview outside modal

import { createPreviewPanel } from "./createPreviewPanel.js";

export function createPreviewController(type) {
  // Floating container
  const container = document.createElement("div");
  container.classList.add("definition-preview-panel");
  container.style.position = "absolute";
  container.style.zIndex   = "1101";
  document.body.append(container);

  const previewApi = createPreviewPanel(type, container);

  function show(def) {
    previewApi.setFromDefinition(def);
    previewApi.show();
    // Position to the right of the modal
    const mc = document.querySelector(".modal-content")?.getBoundingClientRect();
    const pr = container.getBoundingClientRect();
    if (mc && pr.height) {
      container.style.left = `${mc.right + 16}px`;
      container.style.top  = `${mc.top + (mc.height - pr.height)/2}px`;
    }
  }

  function hide() {
    previewApi.hide();
  }

  return { show, hide };
}

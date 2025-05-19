// @file: src/modules/definition/preview/previewController.js
// @version: 1.5 — mount floating preview to body and position off #definition-modal

import { createPreviewPanel } from "./createPreviewPanel.js";

export function createPreviewController(type) {
  // Create a floating container for the preview (appended to <body>)
  const container = document.createElement("div");
  container.classList.add("preview-panel-wrapper");
  container.style.position = "absolute";
  container.style.zIndex   = "1101";
  document.body.append(container);

  // Use the existing preview‐factory to populate it
  const previewApi = createPreviewPanel(type, container);

  function show(def) {
    previewApi.setFromDefinition(def);
    previewApi.show();

    // Position to the right of our definition modal
    const modalEl = document.getElementById("definition-modal");
    if (!modalEl) return;
    const modalContent = modalEl.querySelector(".modal-content");
    if (!modalContent) return;

    const mc = modalContent.getBoundingClientRect();
    const pr = container.getBoundingClientRect();

    // 16px gap, vertically centered
    container.style.left = `${mc.right + 16}px`;
    container.style.top  = `${mc.top + (mc.height - pr.height) / 2}px`;
  }

  function hide() {
    previewApi.hide();
  }

  return { show, hide };
}

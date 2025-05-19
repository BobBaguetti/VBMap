// @file: src\modules\definition\preview\previewController.js
// @version: 1.4 — float preview and position it to the right of the definition modal

import { createPreviewPanel } from "./createPreviewPanel.js";

export function createPreviewController(type) {
  // Create a floating container for the preview
  const container = document.createElement("div");
  container.classList.add("definition-preview-panel");
  container.style.position = "absolute";
  container.style.zIndex   = "1101";
  document.body.append(container);

  const previewApi = createPreviewPanel(type, container);

  function show(def) {
    previewApi.setFromDefinition(def);
    previewApi.show();

    // Find the definition modal's content box
    const modalContent = document.querySelector(".modal.modal--definition .modal-content");
    if (!modalContent) return;

    const mc = modalContent.getBoundingClientRect();
    const pr = container.getBoundingClientRect();

    // Position container to the right of the modal, vertically centered
    container.style.left = `${mc.right + 16}px`;
    container.style.top  = `${mc.top + (mc.height - pr.height) / 2}px`;
  }

  function hide() {
    previewApi.hide();
  }

  return { show, hide };
}

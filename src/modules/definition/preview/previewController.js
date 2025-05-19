// @file: src/modules/definition/preview/previewController.js
// @version: 1.5 — ensure only one floating preview panel exists

import { createPreviewPanel } from "./createPreviewPanel.js";

export function createPreviewController(type) {
  // Remove any existing preview-panel-wrapper to avoid duplicates
  document
    .querySelectorAll(".preview-panel-wrapper")
    .forEach(el => el.remove());

  // Create a fresh floating container for the preview
  const container = document.createElement("div");
  container.classList.add("preview-panel-wrapper");
  container.style.position = "absolute";
  container.style.zIndex   = "1101";
  document.body.append(container);

  // Initialize preview API in our new container
  const previewApi = createPreviewPanel(type, container);

  function show(def) {
    previewApi.setFromDefinition(def);
    previewApi.show();

    // Position to the right of the definition modal
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

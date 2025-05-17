// @file: src/modules/definition/preview/previewController.js
// @version: 1.2 — embed preview directly into the provided host container

import { createPreviewPanel } from "./createPreviewPanel.js";

export function createPreviewController(type, host) {
  // If a host slot is provided, render into it; otherwise float alongside modal
  const container = host || document.createElement("div");

  if (host) {
    // Embedded mode
    container.classList.add("definition-preview-panel", "embedded-preview-panel");
    // ensure static positioning so CSS flex handles layout
    container.style.position = "relative";
  } else {
    // Floating mode
    container.classList.add("definition-preview-panel");
    container.style.zIndex = "1101";
    document.body.appendChild(container);
  }

  const previewApi = createPreviewPanel(type, container);

  function show(def) {
    // just render into container; CSS will place it
    previewApi.setFromDefinition(def);
    previewApi.show();
  }

  function hide() {
    previewApi.hide();
  }

  return { show, hide };
}

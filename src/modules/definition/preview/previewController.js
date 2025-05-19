// @file: src/modules/definition/preview/previewController.js
// @version: 1.5 — embed preview inside modal instead of floating

import { createPreviewPanel } from "./createPreviewPanel.js";

export function createPreviewController(type, host) {
  // Create an inner container and hand it off to createPreviewPanel
  const container = document.createElement("div");
  container.classList.add("definition-preview");  // new class for embedded styling
  host.append(container);

  // Let the factory render its HTML and wire show/hide
  const previewApi = createPreviewPanel(type, container);

  function show(def) {
    previewApi.setFromDefinition(def);
    previewApi.show();   // just toggles .visible
  }

  function hide() {
    previewApi.hide();
  }

  return { show, hide };
}

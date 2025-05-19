// @file: src/modules/definition/preview/previewController.js
// @version: 1.5 — render inside modal host, remove fixed positioning

import { createPreviewPanel } from "./createPreviewPanel.js";

/**
 * type:            "item" or "chest"
 * host:            the <div id="definition-preview-container"> from domBuilder
 */
export function createPreviewController(type, host) {
  // Clear out any legacy wrapper
  host.innerHTML = "";
  // Start hidden
  host.style.display = "none";

  // Build our type-specific panel *into* the host
  const previewApi = createPreviewPanel(type, host);

  return {
    show(def) {
      previewApi.setFromDefinition(def);
      host.style.display = "";      // uses whatever default (block/flex) from modal CSS
    },
    hide() {
      host.style.display = "none";
    }
  };
}

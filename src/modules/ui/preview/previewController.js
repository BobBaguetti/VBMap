// @file: src/modules/ui/preview/previewController.js
// Encapsulates all preview panel setup & usage

import { createPreviewPanel } from "./createPreviewPanel.js";

/**
 * Make a preview controller for a given type (e.g. "item" or "chest").
 * Returns:
 *   - previewApi: the raw API from createPreviewPanel
 *   - show(data): sets definition and shows, positioning intelligently
 *   - hide(): hides the panel
 */
export function createPreviewController(type) {
  // 1) instantiate panel container off-DOM
  const container = document.createElement("div");
  container.style.zIndex = "1101";
  document.body.appendChild(container);

  // 2) get the raw panel API
  const previewApi = createPreviewPanel(type, container);

  // 3) helper to position and show
  function show(data) {
    // position container next to the open modal
    const mc = document.querySelector(".modal-content")?.getBoundingClientRect();
    const pr = container.getBoundingClientRect();
    if (mc) {
      container.style.position = "absolute";
      container.style.left     = `${mc.right + 30}px`;
      container.style.top      = `${mc.top + (mc.height / 2) - (pr.height / 2)}px`;
    }
    previewApi.setFromDefinition(data);
    previewApi.show();
  }

  return {
    previewApi,
    show,
    hide: () => previewApi.hide()
  };
}

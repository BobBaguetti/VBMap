// @file: src/modules/ui/preview/previewController.js
// @version: 1.1 — ensure correct positioning on first show

import { createPreviewPanel } from "./createPreviewPanel.js";

/**
 * Encapsulates preview panel creation, positioning and show/hide.
 */
export function createPreviewController(type) {
  // 1) create offscreen container
  const container = document.createElement("div");
  container.style.zIndex = "1101";
  document.body.appendChild(container);

  // 2) panel API
  const previewApi = createPreviewPanel(type, container);

  // 3) show helper
  function show(data) {
    // put content in
    previewApi.setFromDefinition(data);

    // reveal panel so it gets full size
    previewApi.show();

    // now that it's rendered, position it properly
    const mc = document.querySelector(".modal-content")?.getBoundingClientRect();
    const pr = container.getBoundingClientRect();
    if (mc && pr.height) {
      container.style.position = "absolute";
      container.style.left     = `${mc.right + 30}px`;
      container.style.top      = `${mc.top + (mc.height/2) - (pr.height/2)}px`;
    }
  }

  return {
    previewApi,
    show,
    hide: () => previewApi.hide()
  };
}

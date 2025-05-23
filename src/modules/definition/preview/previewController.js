// @file: src/modules/definition/preview/previewController.js
// @version: 1.7 — restore CSS classes for inline previews

import { createPreviewPanel } from "./createPreviewPanel.js";

/**
 * Factory for definition previews.
 * If a host container is provided, use it for inline preview.
 * Otherwise, create a floating preview panel.
 *
 * @param {string} type      — "item" or "chest"
 * @param {HTMLElement} [host] — inline container inside modal
 * @returns {{ show: Function, hide: Function }}
 */
export function createPreviewController(type, host) {
  let container;
  let isFloating = false;

  if (host) {
    // Inline preview inside the modal
    container = host;
    container.innerHTML = "";

    // Re-apply exact CSS classes so positioning works
    container.classList.add("preview-panel", `${type}-preview-panel`);
  } else {
    // Floating preview outside the modal
    document
      .querySelectorAll(".preview-panel-wrapper")
      .forEach(el => el.remove());

    container = document.createElement("div");
    container.classList.add("preview-panel-wrapper");
    container.style.position = "absolute";
    container.style.zIndex   = "1101";
    document.body.append(container);
    isFloating = true;
  }

  // Initialize type-specific preview API
  const previewApi = createPreviewPanel(type, container);

  function show(def) {
    previewApi.setFromDefinition(def);
    previewApi.show();

    // Position floating panel if used
    if (isFloating) {
      const modalEl = document.getElementById("definition-modal");
      if (!modalEl) return;
      const modalContent = modalEl.querySelector(".modal-content");
      if (!modalContent) return;

      const mc = modalContent.getBoundingClientRect();
      const pr = container.getBoundingClientRect();
      container.style.left = `${mc.right + 16}px`;
      container.style.top  = `${mc.top + (mc.height - pr.height) / 2}px`;
    }
  }

  function hide() {
    previewApi.hide();
    if (isFloating) {
      container.remove();
    }
  }

  return { show, hide };
}

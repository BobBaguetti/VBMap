// @file: src/modules/definition/preview/previewController.js
// @version: 1.7 — fix inline‐ vs. floating‐preview positioning

import { createPreviewPanel } from "./createPreviewPanel.js";

/**
 * Factory for definition previews.
 * - Inline: renders inside the provided host (no repositioning).
 * - Floating: creates ONE .preview-panel-wrapper, absolute‐positions it, and cleans up.
 *
 * @param {string} type      – "item" or "chest"
 * @param {HTMLElement} [host] – container inside the modal for inline preview
 * @returns {{ show: Function, hide: Function }}
 */
export function createPreviewController(type, host) {
  let container;
  let isFloating = false;

  if (host) {
    // INLINE PREVIEW: reuse the host container
    container = host;
    container.innerHTML = "";
    // remove any floating styles if they were accidentally applied
    container.classList.remove("preview-panel-wrapper");
  } else {
    // FLOATING PREVIEW: ensure only one exists
    document
      .querySelectorAll(".preview-panel-wrapper")
      .forEach(el => el.remove());

    container = document.createElement("div");
    container.classList.add("preview-panel-wrapper");
    Object.assign(container.style, {
      position: "absolute",
      zIndex:   "1101"
    });
    document.body.append(container);
    isFloating = true;
  }

  const previewApi = createPreviewPanel(type, container);

  function show(def) {
    previewApi.setFromDefinition(def);
    previewApi.show();

    if (isFloating) {
      // Position the floating panel beside the modal
      const modalEl = document.getElementById("definition-modal");
      if (!modalEl) return;
      const mc = modalEl.querySelector(".modal-content")?.getBoundingClientRect();
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

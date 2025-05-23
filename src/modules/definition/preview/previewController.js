// @file: src/modules/definition/preview/previewController.js
// @version: 1.7 — position inline & floating previews; only remove floating

import { createPreviewPanel } from "./createPreviewPanel.js";

/**
 * Factory for definition previews.
 * If a host container is provided, use it but still position absolutely.
 * Otherwise, create a floating preview panel.
 *
 * @param {string} type      — "item" or "chest"
 * @param {HTMLElement} [host] — inline container inside modal
 * @returns {{ show: Function, hide: Function }}
 */
export function createPreviewController(type, host) {
  let container;
  const isHost = Boolean(host);

  if (isHost) {
    // Reuse the host container, but make it absolute so we can position it
    container = host;
    container.innerHTML = "";
    container.classList.add("preview-panel-container");
    container.style.position = "absolute";
    container.style.zIndex   = "1101";
  } else {
    // Remove any previous floating panels
    document
      .querySelectorAll(".preview-panel-wrapper")
      .forEach(el => el.remove());

    // Create a fresh floating container
    container = document.createElement("div");
    container.classList.add("preview-panel-wrapper");
    container.style.position = "absolute";
    container.style.zIndex   = "1101";
    document.body.append(container);
  }

  // Initialize the type‐specific preview into our container
  const previewApi = createPreviewPanel(type, container);

  function show(def) {
    previewApi.setFromDefinition(def);
    previewApi.show();

    // Now position to the right of the modal
    const modalEl = document.getElementById("definition-modal");
    if (!modalEl) return;
    const modalContent = modalEl.querySelector(".modal-content");
    if (!modalContent) return;

    const mc = modalContent.getBoundingClientRect();
    const pr = container.getBoundingClientRect();
    const left = mc.right + 16;
    const top  = mc.top + (mc.height - pr.height) / 2;

    container.style.left = `${left}px`;
    container.style.top  = `${top}px`;
  }

  function hide() {
    previewApi.hide();
    // Only remove the element if it was dynamically created
    if (!isHost) {
      container.remove();
    }
  }

  return { show, hide };
}

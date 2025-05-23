// @file: src/modules/definition/preview/previewController.js
// @version: 1.8 — inline previews use type‐specific creators directly

import { createItemPreviewPanel } from "./itemPreview.js";
import { createChestPreviewPanel } from "./chestPreview.js";
import { createPreviewPanel }      from "./createPreviewPanel.js"; // for floating

export function createPreviewController(type, host) {
  let container, previewApi, isFloating = false;

  if (host) {
    // ─── Inline preview inside the modal ────────────────────────────────────
    container = host;
    container.innerHTML = "";

    // Use the original creator so CSS classes & structure are preserved
    if (type === "item") {
      previewApi = createItemPreviewPanel(container);
    } else if (type === "chest") {
      previewApi = createChestPreviewPanel(container);
    } else {
      throw new Error(`Unsupported preview type: ${type}`);
    }

  } else {
    // ─── Floating preview outside the modal ────────────────────────────────
    document.querySelectorAll(".preview-panel-wrapper").forEach(el => el.remove());
    container = document.createElement("div");
    container.classList.add("preview-panel-wrapper");
    container.style.position = "absolute";
    container.style.zIndex   = "1101";
    document.body.append(container);
    isFloating = true;

    // Delegate to the generic factory for floating panels
    previewApi = createPreviewPanel(type, container);
  }

  function show(def) {
    previewApi.setFromDefinition(def);
    previewApi.show();

    if (isFloating) {
      const modalEl = document.getElementById("definition-modal");
      const content = modalEl?.querySelector(".modal-content");
      if (!modalEl || !content) return;
      const mc = content.getBoundingClientRect();
      const pr = container.getBoundingClientRect();
      container.style.left = `${mc.right + 16}px`;
      container.style.top  = `${mc.top + (mc.height - pr.height) / 2}px`;
    }
  }

  function hide() {
    previewApi.hide();
    if (isFloating) container.remove();
  }

  return { show, hide };
}

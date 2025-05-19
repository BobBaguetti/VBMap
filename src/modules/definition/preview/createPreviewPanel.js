// @file: src/modules/definition/preview/createPreviewPanel.js
// @version: 6.1 — mount into provided host; drop the global “preview-panel” wrapper

import { createItemPreviewPanel }  from "./itemPreview.js";
import { createChestPreviewPanel } from "./chestPreview.js";

/**
 * @param {string} type        — "item" or "chest"
 * @param {HTMLElement|null} mountTo  — if provided, we render *into* this element
 * @returns {{ container: HTMLElement, setFromDefinition: Function }}
 */
export function createPreviewPanel(type, mountTo = null) {
  // Use mountTo as our container, or fallback to a new element (legacy)
  const container = mountTo || document.createElement("div");

  // Always clear old content
  container.innerHTML = "";

  // Only add the type-specific class; skip the old .preview-panel entirely
  container.classList.add(`${type}-preview-panel`);

  // If no mountTo was passed, do the legacy behavior
  if (!mountTo) {
    // legacy global popup
    container.classList.add("preview-panel");
    document.body.appendChild(container);
  }

  let api;
  switch (type) {
    case "item":
      api = createItemPreviewPanel(container);
      break;
    case "chest":
      api = createChestPreviewPanel(container);
      break;
    default:
      throw new Error(`Unknown preview panel type: ${type}`);
  }

  api.container = container;
  return api;
}

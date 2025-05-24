// @file: src/modules/definition/preview/createPreviewPanel.js
// @version: 6.3 — fix double removal logic; only remove when no mountTo provided

import { createItemPreviewPanel }  from "./itemPreview.js";
import { createChestPreviewPanel } from "./chestPreview.js";
import { createNpcPreviewPanel }   from "./npcPreview.js";

/**
 * Factory function that returns the appropriate preview panel API
 * based on the provided type ("item", "chest", or "npc").
 *
 * @param {string} type              One of "item", "chest", or "npc"
 * @param {HTMLElement|null} mountTo Optional existing container
 * @returns {{ setFromDefinition: Function, show: Function, hide: Function, container: HTMLElement }}
 */
export function createPreviewPanel(type, mountTo = null) {
  let container;

  if (mountTo) {
    // Reuse the provided container; just clear its contents
    container = mountTo;
    container.innerHTML = "";
  } else {
    // Remove any old preview-panel-wrapper elements (only when making a new one)
    document
      .querySelectorAll(".preview-panel-wrapper")
      .forEach(el => el.remove());

    // Create and append a fresh floating container
    container = document.createElement("div");
    container.classList.add("preview-panel-wrapper");
    container.style.position = "absolute";
    container.style.zIndex   = "1101";
    document.body.append(container);
  }

  // Instantiate the correct preview panel
  let api;
  switch (type.toLowerCase()) {
    case "item":
      api = createItemPreviewPanel(container);
      break;
    case "chest":
      api = createChestPreviewPanel(container);
      break;
    case "npc":
      api = createNpcPreviewPanel(container);
      break;
    default:
      throw new Error(`Unknown preview panel type: ${type}`);
  }

  // Expose the container for external positioning
  api.container = container;
  return api;
}

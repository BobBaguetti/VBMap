// @file: src/modules/definition/preview/createPreviewPanel.js
// @version: 6.1 — added NPC preview panel support

import { createItemPreviewPanel }  from "./itemPreview.js";
import { createChestPreviewPanel } from "./chestPreview.js";
import { createNpcPreviewPanel }   from "./npcPreview.js";

/**
 * Factory function that returns the appropriate preview panel API
 * based on the provided type ("item", "chest", "npc").
 *
 * @param {string} type    One of "item", "chest", or "npc".
 * @param {HTMLElement|null} mountTo Optional existing container.
 * @returns {{ setFromDefinition: Function, show: Function, hide: Function, container: HTMLElement }}
 */
export function createPreviewPanel(type, mountTo = null) {
  // Create or reuse container
  const container = mountTo || document.createElement("div");
  container.style.zIndex = 10000;
  if (!mountTo) document.body.appendChild(container);

  let api;
  switch (type) {
    case "item":
      api = createItemPreviewPanel(container);
      break;
    case "chest":
      container.innerHTML = "";
      api = createChestPreviewPanel(container);
      break;
    case "npc":
      container.innerHTML = "";
      api = createNpcPreviewPanel(container);
      break;
    default:
      throw new Error(`Unknown preview panel type: ${type}`);
  }

  // Attach container for external positioning
  api.container = container;
  return api;
}

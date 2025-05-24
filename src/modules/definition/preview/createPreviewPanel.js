// @file: src/modules/definition/preview/createPreviewPanel.js
// @version: 6.2 — support NPC, clear old panels, position container

import { createItemPreviewPanel }  from "./itemPreview.js";
import { createChestPreviewPanel } from "./chestPreview.js";
import { createNpcPreviewPanel }   from "./npcPreview.js";

/**
 * Factory function that returns the appropriate preview panel API
 * based on the provided type ("item", "chest", or "npc").
 *
 * @param {string} type                One of "item", "chest", or "npc"
 * @param {HTMLElement|null} mountTo   Optional existing container
 * @returns {{ setFromDefinition: Function, show: Function, hide: Function, container: HTMLElement }}
 */
export function createPreviewPanel(type, mountTo = null) {
  // 0) Remove any old preview panel(s)
  document
    .querySelectorAll(".preview-panel-wrapper")
    .forEach(el => el.remove());

  // 1) Create a fresh floating container
  const container = mountTo || document.createElement("div");
  container.classList.add("preview-panel-wrapper");
  container.style.position = "absolute";
  container.style.zIndex   = "1101";

  if (!mountTo) {
    document.body.appendChild(container);
  } else {
    // clear out stale content
    container.innerHTML = "";
  }

  // 2) Instantiate the correct preview panel
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

  // 3) Expose the container for positioning
  api.container = container;
  return api;
}

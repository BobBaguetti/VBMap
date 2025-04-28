// comments should not be deleted unless they need updating due to specific commented code changing or the code part is removed
// @file: /scripts/modules/ui/preview/createPreviewPanel.js
// @version: 6

import { createItemPreviewPanel } from "./itemPreview.js";
import { createQuestPreviewPanel } from "./questPreview.js";
import { createNpcPreviewPanel } from "./npcPreview.js";
import { createChestPreviewPanel } from "./chestPreview.js";

/**
 * Factory function that returns the appropriate preview panel API
 * based on the provided type.
 *
 * @param {string} type - One of "item", "quest", "npc", or "chest".
 * @param {HTMLElement|null} mountTo - Optional existing container.
 * @returns {{ container: HTMLElement, setFromDefinition: Function, show: Function, hide: Function }}
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
    case "quest":
      container.innerHTML = "";
      api = createQuestPreviewPanel(container);
      break;
    case "npc":
      container.innerHTML = "";
      api = createNpcPreviewPanel(container);
      break;
    case "chest":
      // clear any previous content
      container.innerHTML = "";
      // use chest-specific preview
      api = createChestPreviewPanel(container);
      break;
    default:
      throw new Error(`Unknown preview panel type: ${type}`);
  }

  // Attach container reference for modals to position
  api.container = container;
  return api;
}

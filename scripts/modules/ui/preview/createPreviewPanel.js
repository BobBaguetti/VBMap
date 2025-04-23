// @version: 2
// @file: /scripts/modules/ui/preview/createPreviewPanel.js

import { createItemPreviewPanel } from "./itemPreview.js";
import { createQuestPreviewPanel } from "./questPreview.js";
import { createNpcPreviewPanel } from "./npcPreview.js";

export function createPreviewPanel(type, mountTo = null) {
  const container = mountTo || document.createElement("div");
  container.style.zIndex = 1101;
  document.body.appendChild(container);

  let api;

  switch (type) {
    case "item":
      api = createItemPreviewPanel(container);
      break;
    case "quest":
      api = createQuestPreviewPanel(container);
      break;
    case "npc":
      api = createNpcPreviewPanel(container);
      break;
    default:
      throw new Error(`Unknown preview panel type: ${type}`);
  }

  api.container = container; // 🔧 Attach container so modals can position it
  return api;
}

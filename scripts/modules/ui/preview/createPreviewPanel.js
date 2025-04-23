// comments should not be deleted unless they need updating due to specific commented code changing or the code part is removed
// @file: /scripts/modules/ui/preview/createPreviewPanel.js
// @version: 3

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
      container.innerHTML = ""; // Remove any placeholder text
      api = createQuestPreviewPanel(container);
      break;
    case "npc":
      container.innerHTML = ""; // Remove any placeholder text
      api = createNpcPreviewPanel(container);
      break;
    default:
      throw new Error(`Unknown preview panel type: ${type}`);
  }

  api.container = container; // 🔧 Attach container so modals can position it
  return api;
}

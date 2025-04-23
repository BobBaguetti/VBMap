// @version: 2
// @file: /scripts/modules/ui/preview/createPreviewPanel.js

import { createItemPreviewPanel } from "./itemPreview.js";
import { createQuestPreviewPanel } from "./questPreview.js";
import { createNpcPreviewPanel } from "./npcPreview.js";

export function createPreviewPanel(type, mountTo = null) {
  const container = mountTo || document.createElement("div");
  container.style.zIndex = 1101;
  document.body.appendChild(container);

  switch (type) {
    case "item":
      return createItemPreviewPanel(container);
    case "quest":
      return createQuestPreviewPanel(container);
    case "npc":
      return createNpcPreviewPanel(container);
    default:
      throw new Error(`Unknown preview panel type: ${type}`);
  }
}

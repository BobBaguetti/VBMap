// @file: src/modules/ui/preview/previewController.js
// @version: 1.1 — always apply nameColor & rarityColor to preview

import { createPreviewPanel } from "./createPreviewPanel.js";

/**
 * Drives the live preview panel for items or chests.
 * @param {"item"|"chest"} type
 */
export function createPreviewController(type) {
  // Panel is created once on init
  const panelContainer = document.createElement("div");
  document.body.appendChild(panelContainer);
  const previewApi = createPreviewPanel(type, panelContainer);

  return {
    show(payload = {}) {
      // Ensure we have defaults
      const {
        name =       "UNNAMED",
        nameColor =  "#E5E6E8",
        itemType =   "",
        itemTypeColor = "#E5E6E8",
        rarity =     "",
        rarityColor =  "#E5E6E8",
        description = "",
        descriptionColor = "#E5E6E8",
        value,
        valueColor = "#E5E6E8",
        quantity,
        quantityColor = "#E5E6E8",
        imageSmall,
        imageLarge,
        extraLines = []
      } = payload;

      // Build a unified data object for your renderer
      const data = {
        name,
        nameColor,
        itemType,
        itemTypeColor,
        rarity,
        rarityColor,
        description,
        descriptionColor,
        value,
        valueColor,
        quantity,
        quantityColor,
        imageSmall,
        imageLarge,
        extraLines
      };

      // Now hand it off to the actual panel:
      previewApi.update(data);
      previewApi.show();
    },

    hide() {
      previewApi.hide();
    }
  };
}

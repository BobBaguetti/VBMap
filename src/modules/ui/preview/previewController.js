// @file: src/modules/ui/preview/previewController.js
// @version: 1.2 — use setFromDefinition() instead of update()

import { createPreviewPanel } from "./createPreviewPanel.js";

/**
 * Drives the live preview panel for items or chests.
 * @param {"item"|"chest"} type
 */
export function createPreviewController(type) {
  // Create panel container once and append to body
  const container = document.createElement("div");
  document.body.appendChild(container);
  const previewApi = createPreviewPanel(type, container);

  return {
    show(payload = {}) {
      // Destructure everything we care about, falling back to defaults
      const {
        name               = "UNNAMED",
        nameColor          = "#E5E6E8",
        itemType           = "",
        itemTypeColor      = "#E5E6E8",
        rarity             = "",
        rarityColor        = "#E5E6E8",
        description        = "",
        descriptionColor   = "#E5E6E8",
        value,
        valueColor         = "#E5E6E8",
        quantity,
        quantityColor      = "#E5E6E8",
        imageSmall,
        imageLarge,
        extraLines         = []
      } = payload;

      // Build a single definition object
      const def = {
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

      // Use the same API your modals use everywhere else:
      // setFromDefinition() then show() :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1} :contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}
      previewApi.setFromDefinition(def);
      previewApi.show();
    },

    hide() {
      previewApi.hide();
    },

    // expose the container if you need to reposition it externally
    container
  };
}

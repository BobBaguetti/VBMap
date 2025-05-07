// @file: /scripts/modules/ui/preview/createPreviewPanel.js
// @version: 1.3 – now uses shared previewHeader & previewStats components

import { makePreviewPanelFactory } from "../../utils/previewPanelFactory.js";
import { renderPreviewHeader }   from "../components/previewHeader.js";
import { renderPreviewStats }    from "../components/previewStats.js";

/**
 * Configure preview factories for each supported type.
 */
const previewFactories = {
  item: makePreviewPanelFactory({
    containerIdClass: "item-preview-panel",
    headerHtml: def =>
      renderPreviewHeader({
        iconUrl:   def.imageSmall || "",
        title:     def.name || "Item",
        titleClass: "item-header"
      }),
    statsHtml: def =>
      renderPreviewStats({
        Type:   def.itemType || "",
        Rarity: def.rarity  || "",
        Value:  def.value   != null ? def.value : ""
      })
  }),

  chest: makePreviewPanelFactory({
    containerIdClass: "chest-preview-panel",
    headerHtml: def =>
      renderPreviewHeader({
        iconUrl:   def.iconUrl || "",
        title:     def.name    || "Chest",
        titleClass: "chest-header"
      }),
    statsHtml: def =>
      renderPreviewStats({
        Category: def.category || "",
        Size:     def.size     || ""
      })
  })
};

/**
 * Create a preview panel for the given type.
 * @param {"item"|"chest"} type
 */
export function createPreviewPanel(type) {
  const factory = previewFactories[type];
  if (!factory) {
    console.warn(`No preview factory for type "${type}"`);
    return {
      setFromDefinition: () => {},
      show:              () => {},
      hide:              () => {}
    };
  }

  // Create a hidden container and attach to body
  const container = document.createElement("div");
  document.body.appendChild(container);

  const panelApi = factory(container);
  panelApi.hide();
  return panelApi;
}

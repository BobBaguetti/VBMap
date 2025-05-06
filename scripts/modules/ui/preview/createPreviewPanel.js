// @file: /scripts/modules/ui/preview/createPreviewPanel.js
// @version: 1.1 – now schema‐driven, removed NPC/Quest

import { makePreviewPanelFactory } from "../../utils/previewPanelFactory.js";

// Configure preview factories for each supported type
const previewFactories = {
  item: makePreviewPanelFactory({
    containerIdClass: "item-preview-panel",
    headerHtml: def => `
      <div class="preview-header-item">
        <img src="${def.imageSmall||""}" onerror="this.style.display='none'" />
        <span>${def.name||"Item"}</span>
      </div>`,
    statsHtml: def => `
      ${def.itemType ? `<strong>${def.itemType}</strong>` : ""}
      ${def.rarity ? `<em>${def.rarity}</em>` : ""}
      ${def.value ? `Value: ${def.value}` : ""}`
  }),

  chest: makePreviewPanelFactory({
    containerIdClass: "chest-preview-panel",
    headerHtml: def => `
      <div class="preview-header-chest">
        <img src="${def.iconUrl||""}" onerror="this.style.display='none'" />
        <span>${def.name||"Chest"}</span>
      </div>`,
    statsHtml: def => `
      Category: ${def.category||"Normal"}<br/>
      Size: ${def.size||"Small"}`
  })
};

/**
 * Create a preview panel for the given type.
 * @param {"item"|"chest"} type
 */
export default function createPreviewPanel(type) {
  const factory = previewFactories[type];
  if (!factory) {
    console.warn(`No preview factory for type "${type}"`);
    return {
      setFromDefinition: () => {},
      show: () => {},
      hide: () => {}
    };
  }

  // Create a hidden container and attach to body
  const container = document.createElement("div");
  document.body.appendChild(container);

  const panelApi = factory(container);
  panelApi.hide();
  return panelApi;
}

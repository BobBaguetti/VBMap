// @comment: Comments should not be deleted unless they need updating due to specific commented code changing or the code part is removed. Functions should include sufficient inline comments.
// @file: /scripts/modules/ui/preview/npcPreview.js
// @version: 2

import { renderPopup } from "../../../scripts/modules/map/markerManager.js";

export function createNpcPreviewPanel(container) {
  const box = document.createElement("div");
  box.className = "item-preview-panel";
  box.style.display = "none";
  container.appendChild(box);

  let currentDef = null;

  function setFromDefinition(def) {
    currentDef = def || {};
    render();
  }

  function render() {
    const def = currentDef || {};
    box.innerHTML = "";

    // Empty state fallback
    if (!def || Object.keys(def).length === 0) {
      const fallback = document.createElement("div");
      fallback.textContent = "Preview for: unnamed NPC";
      fallback.style.padding = "1rem";
      box.appendChild(fallback);
      return;
    }

    const dummy = {
      id: "preview-npc",
      name: def.name || "Unnamed NPC",
      type: def.npcType || "Unknown",
      rarity: def.rarity || "",
      description: def.description || "",
      value: def.value || "",
      quantity: def.quantity || "",
      imageSmall: def.imageSmall || "",
      imageLarge: def.imageLarge || "",
      extraInfo: def.extraInfo || []
    };

    const popup = renderPopup(dummy);
    box.appendChild(popup);
  }

  function show() {
    box.style.display = "block";
  }

  function hide() {
    box.style.display = "none";
  }

  return {
    container: box,
    setFromDefinition,
    show,
    hide
  };
}
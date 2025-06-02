// @file: src/modules/map/marker/popups/lootHoverBinder.js
// Shared utility to bind item-preview hovers onto any slot element
// that has a `data-item-id` attribute. Used by both Chest and NPC popups.

import definitionsManager from "../../../../bootstrap/definitionsManager.js";
import { renderItemPopup }  from "./itemPopup.js";

/**
 * Scan `popupEl` for any elements with `data-item-id="…"`, and attach
 * mouseenter/mouseleave so that hovering shows the correct item popup.
 *
 * @param {HTMLElement} popupEl  — the root DOM node of the popup (e.g. .custom-popup)
 */
export function attachLootHoverListeners(popupEl) {
  if (!popupEl) return;

  // Find ALL elements that represent a slot, whether chest or NPC,
  // as long as they carry data-item-id="…"
  popupEl.querySelectorAll("[data-item-id]").forEach(el => {
    const itemId = el.getAttribute("data-item-id");
    if (!itemId) return;

    // Remove any title attribute (no native tooltip)
    el.removeAttribute("title");

    // mouseenter → look up the full itemDef, render its popup
    el.addEventListener("mouseenter", e => {
      const itemDef = definitionsManager.getDefinitions("Item")[itemId];
      if (!itemDef) return;

      const preview = document.createElement("div");
      preview.className = "chest-item-preview"; // CSS for the floating popup
      preview.innerHTML = renderItemPopup(itemDef);
      Object.assign(preview.style, {
        position: "absolute",
        zIndex:   "1102",
        left:     `${e.clientX + 8}px`,
        top:      `${e.clientY + 8}px`
      });
      document.body.append(preview);
      el._previewEl = preview;
    });

    // mouseleave → remove that floating preview
    el.addEventListener("mouseleave", () => {
      el._previewEl?.remove();
    });
  });
}

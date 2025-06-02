// @file: src/modules/map/marker/popups/lootHoverBinder.js
// Updated to make the hover‐popup follow the cursor.

import definitionsManager from "../../../../bootstrap/definitionsManager.js";
import { renderItemPopup }  from "./itemPopup.js";

/**
 * Scan `popupEl` for any elements with `data-item-id="…"`,
 * and attach mouseenter/mousemove/mouseleave so that hovering
 * shows a floating preview that follows the cursor.
 *
 * @param {HTMLElement} popupEl  — the root DOM node of the popup (e.g. .custom-popup)
 */
export function attachLootHoverListeners(popupEl) {
  if (!popupEl) return;

  popupEl.querySelectorAll("[data-item-id]").forEach(el => {
    const itemId = el.getAttribute("data-item-id");
    if (!itemId) return;

    // Remove any native title‐tooltip
    el.removeAttribute("title");

    let previewEl = null;
    let moveHandler = null;

    el.addEventListener("mouseenter", e => {
      // Look up the full item definition by ID
      const itemDef = definitionsManager.getDefinitions("Item")[itemId];
      if (!itemDef) return;

      // Create preview element
      previewEl = document.createElement("div");
      previewEl.className = "chest-item-preview"; // same styling as before
      previewEl.innerHTML = renderItemPopup(itemDef);
      Object.assign(previewEl.style, {
        position: "absolute",
        zIndex:   "1102",
        // Initial placement near the mouse
        left:     `${e.clientX + 8}px`,
        top:      `${e.clientY + 8}px`
      });
      document.body.append(previewEl);

      // Define a mousemove handler to update the preview’s position
      moveHandler = event => {
        if (previewEl) {
          previewEl.style.left = `${event.clientX + 8}px`;
          previewEl.style.top  = `${event.clientY + 8}px`;
        }
      };
      el.addEventListener("mousemove", moveHandler);
    });

    el.addEventListener("mouseleave", () => {
      // Remove the preview element
      if (previewEl) {
        previewEl.remove();
        previewEl = null;
      }
      // Remove the mousemove listener
      if (moveHandler) {
        el.removeEventListener("mousemove", moveHandler);
        moveHandler = null;
      }
    });
  });
}

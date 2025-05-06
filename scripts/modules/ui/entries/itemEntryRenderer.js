// @file: /scripts/modules/ui/entries/itemEntryRenderer.js
// @version: 1.2 – fixed iconUtils import path

import { createIcon } from "../components/iconUtils.js";

/**
 * Renders a single item definition entry in the list.
 *
 * @param {Object} def            – The item definition object
 * @param {string} layout         – One of "row", "stacked", or "gallery"
 * @param {Function} onClick      – Callback when the entry is clicked
 * @param {Function} onDelete     – Callback when the delete button is clicked
 * @returns {HTMLElement}         – The rendered entry element
 */
export function renderItemEntry(def, layout, onClick, onDelete) {
  const entry = document.createElement("div");
  entry.className = `item-def-entry layout-${layout}`;

  entry.innerHTML = `
    <div class="entry-header">${def.name || "Unnamed Item"}</div>
    <div class="entry-meta">
      ${def.itemType ? `<span class="meta-type">${def.itemType}</span>` : ""}
      ${def.rarity ? `<span class="meta-rarity" style="color:${def.rarityColor || ""}">${def.rarity}</span>` : ""}
    </div>
  `;

  // Delete button
  if (onDelete) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "entry-delete ui-button-delete";
    btn.innerHTML = createIcon("trash", { inline: true }).outerHTML;
    btn.onclick = e => {
      e.stopPropagation();
      if (def.id && confirm(`Delete "${def.name || def.id}"?`)) {
        onDelete(def.id);
      }
    };
    entry.appendChild(btn);
  }

  // Click handler
  if (onClick) {
    entry.addEventListener("click", () => onClick(def));
  }

  return entry;
}

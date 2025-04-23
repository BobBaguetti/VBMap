// @version: 1
// @file: /scripts/modules/utils/itemEntryRenderer.js

import { createIcon } from "../../utils/iconUtils.js";

/**
 * Builds an item entry DOM element.
 *
 * @param {Object} def – item definition
 * @param {string} layout – "row" | "stacked" | "gallery"
 * @param {(id: string) => void} onClick
 * @param {(id: string) => void} onDelete
 * @returns {HTMLElement}
 */
export function renderItemEntry(def, layout = "row", onClick, onDelete) {
  const entry = document.createElement("div");
  entry.className = `item-def-entry layout-${layout}`;

  const valueHtml = def.value
    ? `<div class="entry-value">${def.value} ${createIcon("coins", { inline: true }).outerHTML}</div>`
    : "";

  const quantityHtml = def.quantity
    ? `<div class="entry-quantity">x${def.quantity}</div>`
    : "";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "entry-delete ui-button-delete";
  deleteBtn.title = "Delete this item";
  deleteBtn.appendChild(createIcon("trash"));
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    if (def.id && confirm(`Are you sure you want to delete "${def.name}"?`)) {
      onDelete(def.id);
    }
  };

  entry.innerHTML = `
    <div class="entry-name">${def.name}</div>
    <div class="entry-meta">
      <span class="entry-type" style="color: ${def.itemTypeColor || "#bbb"}">${def.itemType || "—"}</span> –
      <span class="entry-rarity" style="color: ${def.rarityColor || "#bbb"}">${def.rarity?.toUpperCase() || "—"}</span>
    </div>
    <div class="entry-description">${def.description || ""}</div>
    <div class="entry-details">
      ${valueHtml}
      ${quantityHtml}
    </div>
  `;

  entry.appendChild(deleteBtn);
  entry.addEventListener("click", () => {
    if (def.id) onClick(def);
  });

  return entry;
}

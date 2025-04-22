// @version: 2
// @file: /scripts/modules/utils/definitionListManager.js

import { createIcon } from "./iconUtils.js";

export function createDefinitionListManager({
  container,
  getDefinitions,
  onEntryClick,
  onDelete,
  getCurrentLayout = () => "row" // ✅ fallback to "row"
}) {
  function render() {
    const layout = typeof getCurrentLayout === "function" ? getCurrentLayout() : "row";
    const defs = getDefinitions();

    container.innerHTML = "";
    container.className = `def-list ui-scroll-float layout-${layout}`;

    defs.forEach(def => {
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
        if (def.id && confirm(`Delete “${def.name}”?`)) {
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
      entry.addEventListener("click", () => onEntryClick(def));
      container.appendChild(entry);
    });
  }

  return {
    refresh: () => render(),
    setLayout: () => render() // no internal layout state, always call getCurrentLayout
  };
}

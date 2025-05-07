// @file: scripts/modules/ui/entries/chestEntryRenderer.js
// @version: 1.2 – initial Chest list entry renderer

import { createIcon } from "../../utils/domUtils.js";

export function renderChestEntry(def, layout, { onClick, onDelete }) {
  const entry = document.createElement("div");
  entry.className = `chest-def-entry layout-${layout}`;

  // small icon
  const icon = def.iconUrl
    ? `<img src="${def.iconUrl}" class="entry-icon">`
    : "";

  // show size/category and loot count
  entry.innerHTML = `
    <div class="entry-header">
      ${icon}
      <div>
        <div class="entry-name">${def.name}</div>
        <div class="entry-meta">${def.category} • ${def.size}</div>
      </div>
    </div>
    <div class="entry-loot-count">Loot: ${def.lootPool?.length||0}</div>
  `;
  const del = document.createElement("button");
  del.className = "entry-delete ui-button-delete";
  del.appendChild(createIcon("trash"));
  del.onclick = e => { e.stopPropagation(); onDelete(def.id); };
  entry.appendChild(del);

  entry.addEventListener("click", () => onClick(def));
  return entry;
}

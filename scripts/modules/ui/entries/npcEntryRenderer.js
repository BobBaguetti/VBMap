// @file: scripts/modules/ui/entries/npcEntryRenderer.js
// @version: 1.0 – list entry renderer for NPC definitions (2025‑05‑05)

import { createIcon } from "../../utils/iconUtils.js";

export function renderNpcEntry(def, layout, { onClick, onDelete }) {
  const entry = document.createElement("div");
  entry.className = `npc-def-entry layout-${layout}`;

  const iconHtml = def.iconUrl
    ? `<img src="${def.iconUrl}" class="entry-icon">`
    : "";

  const roles = Array.isArray(def.roles) ? def.roles.join(", ") : "";

  entry.innerHTML = `
    <div class="entry-header">
      ${iconHtml}
      <div>
        <div class="entry-name">${def.name}</div>
        <div class="entry-meta">${roles}</div>
      </div>
    </div>
    <div class="entry-stats">HP: ${def.health} • DMG: ${def.damage}</div>
  `;

  const delBtn = document.createElement("button");
  delBtn.className = "entry-delete ui-button-delete";
  delBtn.appendChild(createIcon("trash"));
  delBtn.onclick = e => {
    e.stopPropagation();
    onDelete(def.id);
  };
  entry.appendChild(delBtn);

  entry.addEventListener("click", () => onClick(def));
  return entry;
}

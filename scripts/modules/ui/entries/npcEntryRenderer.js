// @file: scripts/modules/ui/entries/npcEntryRenderer.js
// @version: 1 – initial NPC list entry renderer

import { createIcon } from "../../utils/iconUtils.js";

/**
 * @param {Object} def – NPC definition
 * @param {"row"|"stacked"|"gallery"} layout
 * @param {{ onClick: (def)=>void, onDelete: (id)=>void }} handlers
 */
export function renderNpcEntry(def, layout, { onClick, onDelete }) {
  const entry = document.createElement("div");
  entry.className = `npc-def-entry layout-${layout}`;

  // build roles badges
  const roles = (def.typeFlags||[]).map(f => `<span class="npc-role">${f}</span>`).join(" ");

  entry.innerHTML = `
    <div class="entry-name">${def.name}</div>
    <div class="entry-roles">${roles}</div>
    <div class="entry-stats">
      <span>HP: ${def.health}</span>
      <span>DMG: ${def.damage}</span>
    </div>
    <div class="entry-extra">
      ${def.extraLines?.map(l=>`<p style="color:${l.color}">${l.text}</p>`).join("")}
    </div>
  `;
  // delete button
  const del = document.createElement("button");
  del.className = "entry-delete ui-button-delete";
  del.appendChild(createIcon("trash"));
  del.onclick = e => { e.stopPropagation(); onDelete(def.id); };
  entry.appendChild(del);

  entry.addEventListener("click", () => onClick(def));
  return entry;
}

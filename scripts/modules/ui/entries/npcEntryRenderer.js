// @file: scripts/modules/ui/entries/npcEntryRenderer.js
// @version: 2 – align with item/chest renderers

import { createIcon } from "../../utils/iconUtils.js";

/**
 * Builds an NPC entry DOM element for the definitions list.
 *
 * @param {Object} def         – NPC definition
 * @param {"row"|"stacked"|"gallery"} layout
 * @param {{ onClick: (def)=>void, onDelete: (id)=>void }} handlers
 * @returns {HTMLElement}
 */
export function renderNpcEntry(def, layout, { onClick, onDelete }) {
  const entry = document.createElement("div");
  entry.className = `npc-def-entry layout-${layout}`;

  // Roles badges
  const rolesHtml = (def.typeFlags || [])
    .map(f => `<span class="entry-role-badge">${f}</span>`)
    .join(" ");

  // Stats
  const statsHtml = `
    <span class="entry-stat">HP: ${def.health}</span>
    <span class="entry-stat">DMG: ${def.damage}</span>
  `;

  // Loot & Vendor counts
  const lootCount = Array.isArray(def.lootPool) ? def.lootPool.length : 0;
  const vendCount = Array.isArray(def.vendorInventory) ? def.vendorInventory.length : 0;
  const countsHtml = `
    <span class="entry-counts">
      ${lootCount > 0 ? `${lootCount} loot` : ""}
      ${vendCount > 0 ? `${vendCount} vend` : ""}
    </span>
  `;

  // Extra notes (first line only in list)
  const extraHtml = def.extraLines && def.extraLines.length
    ? `<div class="entry-extra">${def.extraLines[0].text}</div>`
    : "";

  entry.innerHTML = `
    <div class="entry-header">
      <div class="entry-name">${def.name}</div>
      <div class="entry-delete-wrapper">
        <button class="entry-delete ui-button-delete" title="Delete NPC">
          ${createIcon("trash", { inline: true }).outerHTML}
        </button>
      </div>
    </div>
    <div class="entry-meta">
      <div class="entry-roles">${rolesHtml}</div>
      <div class="entry-stats">${statsHtml}</div>
      ${countsHtml}
    </div>
    ${extraHtml}
  `;

  // Delete button handler
  entry.querySelector(".entry-delete").onclick = e => {
    e.stopPropagation();
    if (def.id && confirm(`Delete NPC "${def.name}"?`)) {
      onDelete(def.id);
    }
  };

  // Click anywhere else to edit
  entry.addEventListener("click", () => onClick(def));

  return entry;
}

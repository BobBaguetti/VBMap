// @file: /scripts/modules/ui/entries/npcEntryRenderer.js
// @version: 2.0

/**
 * Renders one sidebar/list entry for an NPC definition.
 *
 * @param {Object} def – NPC definition object
 * @param {"row"|"stacked"|"gallery"} layout
 * @param {{ onClick:function, onDelete:function }} handlers
 * @returns {HTMLElement}
 */
export function renderNpcEntry(def, layout, { onClick, onDelete }) {
  const entry = document.createElement("div");
  entry.className = `npc-def-entry layout-${layout}`;

  const icon = def.imageSmallUrl
    ? `<img src="${def.imageSmallUrl}" class="entry-icon">`
    : "";

  entry.innerHTML = `
    <div class="entry-header">
      ${icon}
      <div>
        <div class="entry-name" style="color:${def.nameColor || "#E5E6E8"}">${def.name}</div>
        <div class="entry-meta">${(def.roles || []).join(", ")}</div>
      </div>
    </div>
    <div class="entry-stats">HP&nbsp;${def.health} • DMG&nbsp;${def.damage}</div>
  `;

  const delBtn = document.createElement("button");
  delBtn.className = "entry-delete ui-button-delete";
  delBtn.textContent = "🗑";
  delBtn.onclick = e => {
    e.stopPropagation();
    onDelete(def.id);
  };
  entry.appendChild(delBtn);

  entry.addEventListener("click", () => onClick(def));
  return entry;
}

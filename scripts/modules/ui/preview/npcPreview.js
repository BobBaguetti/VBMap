// @file: scripts/modules/ui/preview/npcPreview.js
// @version: 2 – aligned to Chest-style preview panel

/**
 * A preview panel for NPC definitions.
 * Shows icon, name, roles, HP/Damage, loot slots, and extra notes.
 */
export function createNpcPreviewPanel(container) {
  container.id = "npc-preview-panel";
  container.className = "preview-panel npc-preview-panel";

  // wrapper for consistent styling
  const wrapper = document.createElement("div");
  wrapper.className = "preview-popup-wrapper";
  container.innerHTML = "";
  container.appendChild(wrapper);

  return {
    /**
     * Populate panel from NPC definition or clear if null.
     * @param {Object|null} def
     *   { name, typeFlags[], health, damage,
     *     lootPool: Array<{id,text,color,imageS}>,
     *     extraLines: Array<{text,color}>,
     *     imageL: string }
     */
    setFromDefinition(def) {
      if (!def) {
        wrapper.innerHTML = "";
        return;
      }

      // Header: icon (Image L) + title/stats
      const iconHtml = def.imageL
        ? `<img class="preview-icon" src="${def.imageL}" alt="${def.name}">`
        : `<div class="preview-icon placeholder"></div>`;

      const rolesHtml = (def.typeFlags || [])
        .map(f => `<span class="npc-role-badge">${f}</span>`)
        .join(" ");

      const headerHtml = `
        <div class="preview-header">
          ${iconHtml}
          <div class="preview-title">
            <div class="preview-name">${def.name}</div>
            <div class="preview-roles">${rolesHtml}</div>
            <div class="preview-stats">
              <span>HP: ${def.health}</span>
              <span>DMG: ${def.damage}</span>
            </div>
          </div>
        </div>`;

      // Loot slots row
      const slotsHtml = def.lootPool?.length
        ? `<div class="npc-slots">
             ${def.lootPool.map(l =>
               `<div class="slot" style="border-color:${l.color}">
                  <img src="${l.imageS||''}" title="${l.text}">
                </div>`
             ).join("")}
           </div>`
        : "";

      // Extra info notes
      const notesHtml = def.extraLines?.length
        ? `<div class="npc-preview-section">
             <h4>Notes</h4>
             ${def.extraLines.map(n =>
               `<p style="color:${n.color}">${n.text}</p>`
             ).join("")}
           </div>`
        : "";

      wrapper.innerHTML = `
        ${headerHtml}
        ${slotsHtml}
        ${notesHtml}
      `;
    },
    show() {
      container.classList.add("visible");
    },
    hide() {
      container.classList.remove("visible");
    }
  };
}

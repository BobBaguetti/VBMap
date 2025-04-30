// @file: scripts/modules/ui/preview/npcPreview.js
// @version: 1 – initial NPC preview panel

/**
 * A preview panel for NPC definitions.
 * Shows name, roles, HP/Damage, loot pool (for hostiles),
 * vendor inventory (for vendors), and extra notes.
 */
export function createNpcPreviewPanel(container) {
  container.id = "npc-preview-panel";
  container.className = "preview-panel npc-preview-panel";

  // wrapper for consistent styling
  const wrapper = document.createElement("div");
  wrapper.className = "preview-popup-wrapper";
  container.appendChild(wrapper);

  return {
    /**
     * @param {Object|null} def
     *   { name, typeFlags[], health, damage,
     *     lootPool: Array<{text,color}>,
     *     vendorInventory: Array<{text,color}>,
     *     extraLines: Array<{text,color}> }
     */
    setFromDefinition(def) {
      if (!def) {
        wrapper.innerHTML = "";
        return;
      }

      // Roles badges
      const rolesHtml = (def.typeFlags||[])
        .map(f => `<span class="npc-role-badge">${f}</span>`)
        .join(" ");

      // Loot list
      const lootHtml = def.lootPool && def.lootPool.length
        ? `<div class="npc-preview-section">
             <h4>Loot Pool</h4>
             ${def.lootPool.map(l =>
               `<p style="color:${l.color}">${l.text}</p>`
             ).join("")}
           </div>`
        : "";

      // Vendor inventory
      const vendHtml = def.vendorInventory && def.vendorInventory.length
        ? `<div class="npc-preview-section">
             <h4>Vendor Inventory</h4>
             ${def.vendorInventory.map(i =>
               `<p style="color:${i.color}">${i.text}</p>`
             ).join("")}
           </div>`
        : "";

      // Extra notes / description
      const notesHtml = def.extraLines && def.extraLines.length
        ? `<div class="npc-preview-section">
             <h4>Notes</h4>
             ${def.extraLines.map(n =>
               `<p style="color:${n.color}">${n.text}</p>`
             ).join("")}
           </div>`
        : "";

      wrapper.innerHTML = `
        <div class="npc-preview-header">
          <div class="npc-preview-name">${def.name}</div>
          <div class="npc-preview-roles">${rolesHtml}</div>
        </div>
        <div class="npc-preview-stats">
          <span>HP: ${def.health}</span>
          <span>DMG: ${def.damage}</span>
        </div>
        ${lootHtml}
        ${vendHtml}
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

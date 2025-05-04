// @file: /scripts/modules/ui/preview/npcPreview.js
// @version: 3.0 – now powered by previewPanelFactory

import { makePreviewPanelFactory } from "../../utils/previewPanelFactory.js";

/**
 * A preview panel for NPC definitions.
 * Shows icon, name, roles, HP/Damage, loot slots, and extra notes.
 */
export const createNpcPreviewPanel = makePreviewPanelFactory({
  containerIdClass: "npc-preview-panel",

  headerHtml: def => {
    const icon = def.imageL
      ? `<img class="preview-icon" src="${def.imageL}" alt="${def.name}">`
      : `<div class="preview-icon placeholder"></div>`;
    const roles = (def.typeFlags||[])
      .map(f => `<span class="npc-role-badge">${f}</span>`).join("");
    return `
      <div class="preview-header">
        ${icon}
        <div class="preview-title">
          <div class="preview-name">${def.name}</div>
          <div class="preview-roles">${roles}</div>
        </div>
      </div>
    `;
  },

  statsHtml: def => `
    <span>HP: ${def.health}</span>
    <span>DMG: ${def.damage}</span>
  `,

  sectionsHtml: [
    def => def.lootPool?.length
      ? `<div class="npc-slots">
           ${def.lootPool.map(l =>
             `<div class="slot" style="border-color:${l.color}">
                <img src="${l.imageS||''}" title="${l.text}">
              </div>`
           ).join("")}
         </div>`
      : "",
    def => def.extraLines?.length
      ? `<div class="npc-preview-section">
           <h4>Notes</h4>
           ${def.extraLines.map(n =>
             `<p style="color:${n.color}">${n.text}</p>`
           ).join("")}
         </div>`
      : ""
  ]
});

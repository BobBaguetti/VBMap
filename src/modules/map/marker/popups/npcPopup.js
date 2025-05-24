// @file: src/modules/map/marker/popups/npcPopup.js
// @version: 1.2 — include chest styling for NPC popup

/**
 * Renders an HTML string for NPC markers on the map,
 * re-using the chest popup styling via the .popup-chest class.
 *
 * @param {Object} def NPC definition data
 * @returns {string} HTML content for Leaflet popup
 */
export function renderNpcPopup(def) {
  const nameColor      = def.nameColor || "";
  const alignColor     = def.alignmentColor || "";
  return `
    <div class="popup-chest popup-npc">
      <h3 style="color:${nameColor}">${def.name}</h3>
      <div class="popup-npc-meta" style="display:flex; gap:0.5em; margin-bottom:0.5em;">
        <span style="color:${alignColor}">
          <strong>Faction:</strong> ${def.faction}
        </span>
        <span><strong>Tier:</strong> ${def.tier}</span>
      </div>
      <div class="popup-npc-stats" style="display:flex; gap:1em; margin-bottom:0.5em;">
        <span><strong>Damage:</strong> ${def.damage}</span>
        <span><strong>HP:</strong> ${def.hp}</span>
      </div>
      <div class="popup-npc-loot" style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:0.5em;">
        ${(def.lootPool || []).map(item =>
          `<img src="${item.imageSmall}" title="${item.name}" class="popup-npc-loot-item" style="width:24px; height:24px; border-radius:4px;"/>`
        ).join("")}
      </div>
      <div class="popup-npc-desc" style="margin-bottom:0.5em;">
        ${def.description || ""}
      </div>
      ${(def.extraLines || []).map(line =>
        `<div class="popup-npc-extra">${line.text}</div>`
      ).join("")}
    </div>
  `;
}
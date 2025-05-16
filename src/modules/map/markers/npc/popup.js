// @file: src/modules/map/markers/npc/popup.js
// @version: 1.0 — popup renderer for NPC markers, using shared popupBase

import popupBase from "../common/popupBase.js";

/**
 * Render the popup HTML for an NPC marker, wrapped in popupBase.
 *
 * @param {Object} def – NPC definition object
 * @returns {string} HTML string for Leaflet bindPopup
 */
export default function renderNPCPopup(def) {
  const image = def.iconSmall
    ? `<img src="${def.iconSmall}" class="popup-image" alt="${def.name}" onerror="this.style.display='none'">`
    : "";
  const typeLabel = def.isHostile ? "Hostile NPC" : "Friendly NPC";

  const extraList = def.extraInfo?.length
    ? `<ul class="popup-extra-info">
         ${def.extraInfo.map(line => `<li>${line}</li>`).join("")}
       </ul>`
    : "";

  // build the inner content (everything *inside* the wrapper)
  const inner = `
    <div class="popup-header">
      <div class="popup-header-left">
        ${image}
        <div class="popup-info">
          <div class="popup-name">${def.name}</div>
          <div class="popup-type">${typeLabel}</div>
        </div>
      </div>
    </div>
    <div class="popup-body">
      ${def.description ? `<p>${def.description}</p>` : ""}
      <p><strong>HP:</strong> ${def.health} &nbsp; <strong>Damage:</strong> ${def.damage}</p>
      <p><strong>Loot:</strong> ${def.lootTable.join(", ")}</p>
      ${extraList}
    </div>
  `;

  // wrap with the shared container & close-button
  return popupBase(inner);
}

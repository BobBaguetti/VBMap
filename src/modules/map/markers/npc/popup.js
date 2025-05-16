/* @file: src/modules/map/markers/npc/popup.js */
/* @version: 1.0 — popup for NPC markers */

import { wrapPopup } from "../common/popupBase.js";

export default function renderNPCPopup(def) {
  // Close button
  const closeBtn = `<span class="popup-close-btn">✖</span>`;

  // Header: image + name + type
  const img = def.iconSmall
    ? `<img src="${def.iconSmall}" class="popup-image" alt="${def.name}" onerror="this.style.display='none'"/>`
    : "";
  const typeLabel = def.isHostile ? "Hostile NPC" : "Friendly NPC";
  const header = `
    <div class="popup-header">
      <div class="popup-header-left">
        ${img}
        <div class="popup-info">
          <div class="popup-name">${def.name}</div>
          <div class="popup-type">${typeLabel}</div>
        </div>
      </div>
    </div>`;

  // Body: description, stats, loot, extra info
  const desc = def.description
    ? `<p>${def.description}</p>`
    : "";
  const stats = `<p><strong>HP:</strong> ${def.health} &nbsp; <strong>Damage:</strong> ${def.damage}</p>`;
  const loot = def.lootTable?.length
    ? `<p><strong>Loot:</strong> ${def.lootTable.join(", ")}</p>`
    : "";
  const extra = def.extraInfo?.length
    ? `<ul class="popup-extra-info">
         ${def.extraInfo.map(line => `<li>${line}</li>`).join("")}
       </ul>`
    : "";
  const body = `<div class="popup-body">${desc}${stats}${loot}${extra}</div>`;

  return wrapPopup(closeBtn + header + body);
}

// @file: src/modules/sidebar/filters/mainFilters.js
// @version: 1.3 — swap “Chest” icon to Phosphor

export function setupMainFilters(containerSelector, onChange) {
  const iconMap = {
    Item:      "fas fa-box-open",
    Chest:     "ph-regular ph-chest",    // <-- Phosphor chest
    NPC:       "fas fa-user",
    Quest:     "fas fa-flag",
    Misc:      "fas fa-ellipsis-h"
  };

  const container = document.querySelector(containerSelector);
  if (!container) return;

  ["Item", "Chest", "NPC", "Quest", "Misc"].forEach(type => {
    if (!container.querySelector(`input[data-layer="${type}"]`)) {
      const lbl = document.createElement("label");
      const labelText = type === "Item" ? "Items"
                        : type === "NPC"  ? "NPCs"
                        : type;

      lbl.innerHTML = `
        <input type="checkbox" checked data-layer="${type}" />
        <i class="filter-icon ${iconMap[type]}"></i>
        <span>${labelText}</span>
      `;
      container.appendChild(lbl);
      lbl.querySelector("input").addEventListener("change", onChange);
    }
  });
}

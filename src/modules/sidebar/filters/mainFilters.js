// @file: src/modules/sidebar/filters/mainFilters.js
// @version: 1.3.1 — use correct Phosphor class for Chest

export function setupMainFilters(containerSelector, onChange) {
  const iconMap = {
    Item:      "fas fa-box-open",
    Chest:     "ph ph-treasure-chest",     // <---- use `ph ph-chest`
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

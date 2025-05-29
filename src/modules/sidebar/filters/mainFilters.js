// @file: src/modules/sidebar/filters/mainFilters.js
// @version: 1.2 — add filter-icon <i> before each label

export function setupMainFilters(containerSelector, onChange) {
  const iconMap = {
    Item:      "fa-box-open",
    Chest:     "fa-box",
    NPC:       "fa-user",
    Quest:     "fa-flag",
    Misc:      "fa-ellipsis-h"
  };

  const container = document.querySelector(containerSelector);
  if (!container) return;

  // Include “Item” alongside the other layer types
  ["Item", "Chest", "NPC", "Quest", "Misc"].forEach(type => {
    // Avoid duplicating toggles if they already exist
    if (!container.querySelector(`input[data-layer="${type}"]`)) {
      const lbl = document.createElement("label");

      // Pluralize label for Item → Items, NPC → NPCs
      const labelText = type === "Item" ? "Items"
                        : type === "NPC"  ? "NPCs"
                        : type;

      lbl.innerHTML = `
        <input type="checkbox" checked data-layer="${type}" />
        <i class="filter-icon fas ${iconMap[type]}"></i>
        <span>${labelText}</span>
      `;

      container.appendChild(lbl);
      lbl.querySelector("input").addEventListener("change", onChange);
    }
  });
}

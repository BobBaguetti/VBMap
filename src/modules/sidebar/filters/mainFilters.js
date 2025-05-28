// @file: src/modules/sidebar/filters/mainFilters.js
// @version: 1.1 — added “Item” to main layer toggles

export function setupMainFilters(containerSelector, onChange) {
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
      lbl.innerHTML = `<input type="checkbox" checked data-layer="${type}" />
                       <span>${labelText}</span>`;
      container.appendChild(lbl);
      lbl.querySelector("input").addEventListener("change", onChange);
    }
  });
}

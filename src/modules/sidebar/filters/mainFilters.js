// @file: src/modules/sidebar/filters/mainFilters.js
// @version: 1.0 — main layer toggles (Chest, NPC, Quest, Misc)

export function setupMainFilters(containerSelector, onChange) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  ["Chest","NPC","Quest","Misc"].forEach(type => {
    if (!container.querySelector(`input[data-layer="${type}"]`)) {
      const lbl = document.createElement("label");
      lbl.innerHTML = `<input type="checkbox" checked data-layer="${type}"/><span>${type}${type==="NPC"?"s":""}</span>`;
      container.appendChild(lbl);
      lbl.querySelector("input").addEventListener("change", onChange);
    }
  });
}

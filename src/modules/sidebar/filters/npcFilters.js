// @file: src/modules/sidebar/filters/npcFilters.js
// @version: 1.0 — hostile/friendly NPC toggles

export function setupNpcFilters(hostileSelector, friendlySelector, onChange) {
  const hostile = document.querySelector(hostileSelector);
  const friendly = document.querySelector(friendlySelector);
  if (!hostile || !friendly ||
      hostile.querySelector("input") || friendly.querySelector("input")) {
    return;
  }
  ["Hostile","Friendly"].forEach(type => {
    const lbl = document.createElement("label");
    lbl.innerHTML = `
      <input type="checkbox" checked data-npc-type="${type}"/>
      <span>${type}</span>
    `;
    (type === "Hostile" ? hostile : friendly).appendChild(lbl);
    lbl.querySelector("input").addEventListener("change", onChange);
  });
}

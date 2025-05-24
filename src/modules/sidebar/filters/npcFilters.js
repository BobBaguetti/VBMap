// @file: src/modules/sidebar/filters/npcFilters.js
// @version: 1.2 — group by alignment, not faction

import { loadNpcDefinitions } from "../../services/npcDefinitionsService.js";

/**
 * Build checkbox filters for NPC definitions, split into
 * a “Hostile” container and a “Friendly” container.
 *
 * @param {string} hostileSelector   – DOM selector for the hostile-NPC filter container
 * @param {string} friendlySelector  – DOM selector for the friendly-NPC filter container
 * @param {firebase.firestore.Firestore} db
 * @param {() => void} onChange     – callback to re-apply filters
 */
export async function setupNpcFilters(
  hostileSelector,
  friendlySelector,
  db,
  onChange
) {
  const hostileContainer  = document.querySelector(hostileSelector);
  const friendlyContainer = document.querySelector(friendlySelector);
  if (!hostileContainer || !friendlyContainer) return;

  hostileContainer.innerHTML  = "";
  friendlyContainer.innerHTML = "";

  const defs = await loadNpcDefinitions(db);
  defs.filter(d => d.showInFilters).forEach(def => {
    const lbl = document.createElement("label");
    lbl.className = "filter-entry filter-npc-entry";

    const cb = document.createElement("input");
    cb.type           = "checkbox";
    cb.checked        = true;
    cb.dataset.npcId  = def.id;
    cb.addEventListener("change", onChange);

    const img = document.createElement("img");
    img.src       = def.imageSmall;
    img.alt       = def.name;
    img.className = "filter-icon";
    img.width     = 20;
    img.height    = 20;

    const span = document.createElement("span");
    span.textContent = def.name;

    lbl.append(cb, img, span);

    if (def.alignment === "Friendly") {
      friendlyContainer.appendChild(lbl);
    } else {
      hostileContainer.appendChild(lbl);
    }
  });
}

// @file: src/modules/sidebar/filters/npcFilters.js
// @version: 1.2 — group by disposition, not faction

import { loadNpcDefinitions } from "../../services/npcDefinitionsService.js";

/**
 * Build checkbox filters for NPC definitions, split into
 * a “Hostile” container and a “Friendly” container.
 *
 * @param {string} hostileSelector   – DOM selector for the hostile-NPC filter container
 * @param {string} friendlySelector  – DOM selector for the friendly-NPC filter container
 * @param {import('firebase/firestore').Firestore} db
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

  // Clear any existing filters
  hostileContainer.innerHTML  = "";
  friendlyContainer.innerHTML = "";

  // Load only defs flagged showInFilters
  const defs = await loadNpcDefinitions(db);
  defs
    .filter(d => d.showInFilters)
    .forEach(def => {
      const lbl = document.createElement("label");
      lbl.className = "filter-entry filter-npc-entry";

      // Checkbox
      const cb = document.createElement("input");
      cb.type           = "checkbox";
      cb.checked        = true;
      cb.dataset.npcId  = def.id;
      cb.addEventListener("change", onChange);

      // Thumbnail
      const img = document.createElement("img");
      img.src       = def.imageSmall || "";
      img.alt       = def.name;
      img.className = "filter-icon";
      img.width     = 20;
      img.height    = 20;

      // Label
      const span = document.createElement("span");
      span.textContent = def.name;

      lbl.append(cb, img, span);

      // Group by disposition, not faction
      if (def.disposition === "Friendly") {
        friendlyContainer.appendChild(lbl);
      } else {
        hostileContainer.appendChild(lbl);
      }
    });
}

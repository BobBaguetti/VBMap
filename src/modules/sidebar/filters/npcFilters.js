// @file: src/modules/sidebar/filters/npcFilters.js
// @version: 1.3 — use disposition (not faction) to split into Friendly vs Hostile

import {
  loadNpcDefinitions,
  subscribeNpcDefinitions
} from "../../services/npcDefinitionsService.js";

/**
 * Build and keep updated checkbox filters for NPC definitions,
 * split into “Hostile” and “Friendly” containers.
 *
 * @param {string} hostileSelector   – DOM selector for hostile-NPC filter container
 * @param {string} friendlySelector  – DOM selector for friendly-NPC filter container
 * @param {import('firebase/firestore').Firestore} db
 * @param {() => void} onChange     – callback to re-apply filters
 * @returns {() => void} unsubscribe – call to tear down the listener
 */
export function setupNpcFilters(
  hostileSelector,
  friendlySelector,
  db,
  onChange
) {
  const hostileContainer  = document.querySelector(hostileSelector);
  const friendlyContainer = document.querySelector(friendlySelector);
  if (!hostileContainer || !friendlyContainer) return () => {};

  function render(defs) {
    hostileContainer.innerHTML  = "";
    friendlyContainer.innerHTML = "";

    defs
      .filter(d => d.showInFilters)
      .forEach(def => {
        const lbl = document.createElement("label");
        lbl.className = "filter-entry filter-npc-entry";

        const cb = document.createElement("input");
        cb.type           = "checkbox";
        cb.checked        = true;
        cb.dataset.npcId  = def.id;
        cb.addEventListener("change", onChange);

        const img = document.createElement("img");
        img.src       = def.imageSmall || "";
        img.alt       = def.name;
        img.className = "filter-icon";
        img.width     = 20;
        img.height    = 20;

        const span = document.createElement("span");
        span.textContent = def.name;

        lbl.append(cb, img, span);

        // Split by disposition rather than faction
        if (def.disposition === "Friendly") {
          friendlyContainer.appendChild(lbl);
        } else {
          hostileContainer.appendChild(lbl);
        }
      });
  }

  // initial load
  loadNpcDefinitions(db).then(render);

  // live updates
  const unsubscribe = subscribeNpcDefinitions(db, docs => {
    render(docs);
    onChange();
  });

  return unsubscribe;
}

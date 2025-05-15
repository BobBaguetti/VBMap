// @file: src/modules/sidebar/filters/npcFilters.js
// @version: 1.0 — Hostile & Friendly NPC toggles, loaded from Firestore

import { loadNpcs } from "../../modules/services/definitions/npcService.js";

/**
 * Populate two lists of NPC filters: hostile and friendly.
 *
 * @param {string} hostileContainerSelector – CSS selector for hostile NPCs list
 * @param {string} friendlyContainerSelector – selector for friendly NPCs list
 * @param {import('firebase/firestore').Firestore} db – Firestore instance
 * @param {() => void} onChange – callback when any checkbox toggles
 */
export async function setupNpcFilters(
  hostileContainerSelector,
  friendlyContainerSelector,
  db,
  onChange
) {
  const hostileContainer = document.querySelector(hostileContainerSelector);
  const friendlyContainer = document.querySelector(friendlyContainerSelector);
  if (!hostileContainer || !friendlyContainer) return;

  // clear any existing
  hostileContainer.innerHTML = "";
  friendlyContainer.innerHTML = "";

  const defs = await loadNpcs(db);
  defs.filter(d => d.showInFilters).forEach(d => {
    const lbl = document.createElement("label");
    const cb  = document.createElement("input");
    const img = document.createElement("img");
    const span= document.createElement("span");

    cb.type           = "checkbox";
    cb.checked        = true;
    cb.dataset.npcId  = d.id;
    cb.addEventListener("change", onChange);

    img.src           = d.iconSmallUrl;
    img.alt           = d.name;
    img.className     = "filter-icon";
    img.width         = 20;
    img.height        = 20;

    span.textContent  = d.name;

    lbl.append(cb, img, span);
    if (d.isHostile) hostileContainer.appendChild(lbl);
    else              friendlyContainer.appendChild(lbl);
  });
}

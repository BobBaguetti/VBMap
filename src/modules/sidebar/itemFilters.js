// @file: src/modules/sidebar/itemFilters.js
// @version: 1.1 — fix import path to itemDefinitionsService

import { loadItemDefinitions } from "../services/itemDefinitionsService.js";

/**
 * Populate the item filter list with checkboxes for each item definition.
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {HTMLElement} container — the #item-filter-list element
 * @param {() => void} onFilterChange — callback to re-filter markers
 * @returns {Promise<void>}
 */
export async function loadItemFilters(db, container, onFilterChange) {
  container.innerHTML = "";
  const defs = await loadItemDefinitions(db);

  defs.forEach(def => {
    const row = document.createElement("div");
    row.className = "filter-row";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.dataset.layer = def.id;  // use id to identify in data.type
    cb.checked = true;
    cb.addEventListener("change", onFilterChange);

    const lbl = document.createElement("label");
    lbl.textContent = def.name;

    row.append(cb, lbl);
    container.append(row);
  });
}

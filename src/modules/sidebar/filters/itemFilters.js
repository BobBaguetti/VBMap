// @file: src/modules/sidebar/filters/itemFilters.js
// @version: 1.0 — per‐item checkbox filters

import { loadItemDefinitions } from "../../services/itemDefinitionsService.js";

/**
 * Renders item‐specific filters under a heading,
 * and wires each checkbox to call onChange when toggled.
 *
 * @param {HTMLElement} container – where to append the item filters group
 * @param {() => void} onChange   – callback when any item checkbox changes
 * @param {firebase.firestore.Firestore} db
 * @returns {Promise<HTMLElement>} the populated container
 */
export async function renderItemFilters(container, onChange, db) {
  container.innerHTML = `
    <div class="filter-group" id="item-filter-list">
      <h3>Item Filters</h3>
    </div>
  `;
  const listDiv = container.querySelector("#item-filter-list");

  const defs = await loadItemDefinitions(db);
  defs
    .filter(d => d.showInFilters)
    .forEach(d => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" checked data-item-id="${d.id}"><span>${d.name}</span>`;
      const cb = label.querySelector("input");
      cb.addEventListener("change", onChange);
      listDiv.appendChild(label);
    });

  return container;
}

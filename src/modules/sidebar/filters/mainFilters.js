// @file: src/modules/sidebar/filters/mainFilters.js
// @version: 1.0 — top‐level Items/Chests/PvE toggles + search

/**
 * Renders the main filters (Items, Chests, PvE) and search bar wiring.
 *
 * @param {HTMLElement} container – where to append the main‐filters group
 * @param {() => void} onChange   – callback when any toggle/search changes
 * @returns {{
 *   elements: {
 *     itemToggle: HTMLInputElement,
 *     chestToggle: HTMLInputElement,
 *     pveToggle: HTMLInputElement,
 *     searchBar: HTMLInputElement
 *   }
 * }}
 */
export function renderMainFilters(container, onChange) {
  container.innerHTML = `
    <div class="filter-group" id="main-filters">
      <h3>Main Filters</h3>
      <div class="toggle-group">
        <label><input type="checkbox" data-layer="Item" checked><span>Items</span></label>
        <label><input type="checkbox" data-layer="Chest" checked><span>Chests</span></label>
        <label><input type="checkbox" id="toggle-pve" checked><span>Show PvE Items</span></label>
      </div>
    </div>`;
  
  const itemToggle  = container.querySelector('input[data-layer="Item"]');
  const chestToggle = container.querySelector('input[data-layer="Chest"]');
  const pveToggle   = container.querySelector('#toggle-pve');
  const searchBar   = document.getElementById("search-bar");

  [itemToggle, chestToggle, pveToggle, searchBar].forEach(el => {
    if (el) el.addEventListener("change", onChange);
  });

  return { elements: { itemToggle, chestToggle, pveToggle, searchBar } };
}

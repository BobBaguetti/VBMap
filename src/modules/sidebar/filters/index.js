// @file: src/modules/sidebar/filters/index.js
// @version: 1.1 — return loadItemFilters alongside filterMarkers

import { setupMainFilters }  from "./mainFilters.js";
import { setupChestFilters } from "./chestFilters.js";
import { setupNpcFilters }   from "./npcFilters.js";
import { setupItemFilters }  from "./itemFilters.js";

/**
 * Wires up all sidebar filters and exposes the core APIs.
 *
 * @param {object} params
 *   - searchBarSelector
 *   - mainFiltersSelector
 *   - pveToggleSelector
 *   - itemFilterListSelector
 *   - chestFilterListSelector
 *   - npcHostileListSelector
 *   - npcFriendlyListSelector
 *   - layers
 *   - allMarkers
 *   - db
 * @returns {{
 *   filterMarkers: () => void,
 *   loadItemFilters: () => Promise<void>
 * }}
 */
export function setupSidebarFilters(params) {
  const {
    searchBarSelector,
    mainFiltersSelector,
    pveToggleSelector,
    itemFilterListSelector,
    chestFilterListSelector,
    npcHostileListSelector,
    npcFriendlyListSelector,
    layers,
    allMarkers,
    db
  } = params;

  // Core filter function (identical to previous monolith)
  function filterMarkers() {
    const searchBar = document.querySelector(searchBarSelector);
    const pveToggle = document.querySelector(pveToggleSelector);
    const nameQuery = (searchBar?.value || "").toLowerCase();
    const pveOn     = pveToggle?.checked ?? true;

    allMarkers.forEach(({ markerObj, data }) => {
      // PvE and name match
      const matchesPvE   = pveOn || data.type !== "Item";
      const matchesName = data.name?.toLowerCase().includes(nameQuery);

      // Main-layer toggles
      let mainVisible = true;
      document
        .querySelectorAll(mainFiltersSelector + " input[type=checkbox]")
        .forEach(cb => {
          if (data.type === cb.dataset.layer && !cb.checked) {
            mainVisible = false;
          }
        });

      // Item-specific
      let itemVisible = true;
      if (data.predefinedItemId) {
        const cb = document.querySelector(
          `${itemFilterListSelector} input[data-item-id="${data.predefinedItemId}"]`
        );
        if (cb && !cb.checked) itemVisible = false;
      }

      // Chest-specific
      let chestVisible = true;
      if (data.type === "Chest") {
        chestVisible = false;
        document
          .querySelectorAll(chestFilterListSelector + " input[type=checkbox]")
          .forEach(cb => {
            const f = cb.dataset.chestFilter;
            if (
              (f === "size"     && data.size     === cb.dataset.chestSize && cb.checked) ||
              (f === "category" && data.category === cb.dataset.chestCategory && cb.checked)
            ) chestVisible = true;
          });
      }

      // NPC-specific
      let npcVisible = true;
      if (data.type === "NPC") {
        npcVisible = false;
        const listSelector =
          data.npcType === "Hostile" ? npcHostileListSelector : npcFriendlyListSelector;
        document
          .querySelectorAll(`${listSelector} input[type=checkbox]`)
          .forEach(cb => {
            if (data.npcType === cb.dataset.npcType && cb.checked) {
              npcVisible = true;
            }
          });
      }

      const shouldShow =
        matchesPvE &&
        matchesName &&
        mainVisible &&
        itemVisible &&
        chestVisible &&
        npcVisible;

      const group = layers[data.type];
      if (!group) return;
      shouldShow ? group.addLayer(markerObj) : group.removeLayer(markerObj);
    });
  }

  // Wire the static filters
  setupMainFilters(mainFiltersSelector, filterMarkers);
  setupChestFilters(chestFilterListSelector, filterMarkers);
  setupNpcFilters(npcHostileListSelector, npcFriendlyListSelector, filterMarkers);

  // Expose loadItemFilters as an async function
  async function loadItemFilters() {
    await setupItemFilters(itemFilterListSelector, db, filterMarkers);
  }

  return { filterMarkers, loadItemFilters };
}

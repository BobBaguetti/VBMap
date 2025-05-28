// @file: src/modules/sidebar/filters/index.js
// @version: 1.5 — enforce category toggle overrides individual sizes

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
export async function setupSidebarFilters(params) {
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

  function filterMarkers() {
    const searchBar = document.querySelector(searchBarSelector);
    const pveToggle = document.querySelector(pveToggleSelector);
    const nameQuery = (searchBar?.value || "").toLowerCase();
    const pveOn     = pveToggle?.checked ?? true;

    allMarkers.forEach(({ markerObj, data }) => {
      const matchesPvE  = pveOn || data.type !== "Item";
      const matchesName = data.name?.toLowerCase().includes(nameQuery);

      // Main-layer toggles
      let mainVisible = true;
      document
        .querySelectorAll(`${mainFiltersSelector} input[type=checkbox]`)
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
        // If the category is unchecked, hide all regardless of size
        const catCb = document.querySelector(
          `${chestFilterListSelector} input[data-chest-filter="category"][data-chest-category="${data.category}"]`
        );
        if (catCb && !catCb.checked) {
          chestVisible = false;
        } else {
          // Category is allowed—now respect the size toggle
          const sizeCb = document.querySelector(
            `${chestFilterListSelector} input[data-chest-filter="size"][data-chest-size="${data.size}"]`
          );
          chestVisible = sizeCb ? sizeCb.checked : true;
        }
      }

      // NPC-specific
      let npcVisible = true;
      if (data.type === "NPC") {
        const selector =
          `${npcHostileListSelector} input[data-npc-id="${data.npcDefinitionId}"],` +
          `${npcFriendlyListSelector} input[data-npc-id="${data.npcDefinitionId}"]`;
        const cb = document.querySelector(selector);
        if (cb && !cb.checked) {
          npcVisible = false;
        }
      }

      // Final decision
      const shouldShow =
        matchesPvE &&
        matchesName &&
        mainVisible &&
        itemVisible &&
        chestVisible &&
        npcVisible;

      const group = layers[data.type];
      if (!group) return;

      if (shouldShow) group.addLayer(markerObj);
      else           group.removeLayer(markerObj);
    });
  }

  // Wire the static filters
  setupMainFilters(mainFiltersSelector, filterMarkers);
  setupChestFilters(chestFilterListSelector, filterMarkers);

  // Await NPC filter setup so we can pass `db`
  await setupNpcFilters(
    npcHostileListSelector,
    npcFriendlyListSelector,
    db,
    filterMarkers
  );

  // Expose loadItemFilters as an async function
  async function loadItemFilters() {
    await setupItemFilters(itemFilterListSelector, db, filterMarkers);
  }

  return { filterMarkers, loadItemFilters };
}

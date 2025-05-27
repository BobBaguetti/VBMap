// @file: src/modules/sidebar/filters/index.js
// @version: 1.3 — fix NPC filter selector so it targets inputs in both containers

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

  // Core filter function
  function filterMarkers() {
    const searchBar = document.querySelector(searchBarSelector);
    const pveToggle = document.querySelector(pveToggleSelector);
    const nameQuery = (searchBar?.value || "").toLowerCase();
    const pveOn     = pveToggle?.checked ?? true;

    allMarkers.forEach(({ markerObj, data }) => {
      const matchesPvE   = pveOn || data.type !== "Item";
      const matchesName  = data.name?.toLowerCase().includes(nameQuery);

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
            ) {
              chestVisible = true;
            }
          });
      }

      // NPC-specific
      let npcVisible = true;
      if (data.type === "NPC") {
        npcVisible = false;
        document
          .querySelectorAll(
            `${npcHostileListSelector} input[data-npc-id], ` +
            `${npcFriendlyListSelector} input[data-npc-id]`
          )
          .forEach(cb => {
            if (cb.dataset.npcId === data.npcDefinitionId && cb.checked) {
              npcVisible = true;
            }
          });
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

      if (shouldShow) {
        group.addLayer(markerObj);
      } else {
        group.removeLayer(markerObj);
      }
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

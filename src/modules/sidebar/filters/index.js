// @file: src/modules/sidebar/filters/index.js
// @version: 1.3 — fix NPC filter matching to use marker data’s `id`

import { setupMainFilters }  from "./mainFilters.js";
import { setupChestFilters } from "./chestFilters.js";
import { setupNpcFilters }   from "./npcFilters.js";
import { setupItemFilters }  from "./itemFilters.js";

/**
 * Wires up all sidebar filters and exposes the core APIs.
 *
 * @param {object} params
 *   - … (same as before)
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
      // PvE & name filters
      const matchesPvE  = pveOn || data.type !== "Item";
      const matchesName = data.name?.toLowerCase().includes(nameQuery);

      // Main layer toggles
      let mainVisible = true;
      document
        .querySelectorAll(mainFiltersSelector + " input[type=checkbox]")
        .forEach(cb => {
          if (data.type === cb.dataset.layer && !cb.checked) {
            mainVisible = false;
          }
        });

      // Item filters (unchanged)…
      let itemVisible = true;
      if (data.predefinedItemId) {
        const cb = document.querySelector(
          `${itemFilterListSelector} input[data-item-id="${data.predefinedItemId}"]`
        );
        if (cb && !cb.checked) itemVisible = false;
      }

      // Chest filters (unchanged)…
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

      // NPC filters: match on data.id (the NPC definition’s id)
      let npcVisible = true;
      if (data.type === "NPC") {
        npcVisible = false;
        // both friendly and hostile lists share data-npc-id
        document
          .querySelectorAll(
            `${npcHostileListSelector} input[data-npc-id],
             ${npcFriendlyListSelector} input[data-npc-id]`
          )
          .forEach(cb => {
            if (cb.dataset.npcId === data.id && cb.checked) {
              npcVisible = true;
            }
          });
      }

      // Decide final visibility
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

  // Wire up filters
  setupMainFilters(mainFiltersSelector, filterMarkers);
  setupChestFilters(chestFilterListSelector, filterMarkers);

  await setupNpcFilters(
    npcHostileListSelector,
    npcFriendlyListSelector,
    db,
    filterMarkers
  );

  async function loadItemFilters() {
    await setupItemFilters(itemFilterListSelector, db, filterMarkers);
  }

  return { filterMarkers, loadItemFilters };
}

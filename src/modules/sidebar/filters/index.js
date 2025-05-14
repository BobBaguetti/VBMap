// @file: src/modules/sidebar/filters/index.js
// @version: 1.0 — entry-point composing all filter modules

import { setupMainFilters }  from "./mainFilters.js";
import { setupChestFilters } from "./chestFilters.js";
import { setupNpcFilters }   from "./npcFilters.js";
import { setupItemFilters }  from "./itemFilters.js";

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

  function filterMarkers() { /* your existing logic */ }

  // wire up core events (searchBar, pveToggle, main filters change...)

  setupMainFilters(mainFiltersSelector, filterMarkers);
  setupChestFilters(chestFilterListSelector, filterMarkers);
  setupNpcFilters(npcHostileListSelector, npcFriendlyListSelector, filterMarkers);
  setupItemFilters(itemFilterListSelector, db, filterMarkers);

  return { filterMarkers };
}

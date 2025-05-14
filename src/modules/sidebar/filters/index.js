// @file: src/modules/sidebar/filters/index.js
// @version: 1.1 — return loadItemFilters alongside filterMarkers for initSidebar

import { setupMainFilters }  from "./mainFilters.js";
import { setupChestFilters } from "./chestFilters.js";
import { setupNpcFilters }   from "./npcFilters.js";
import { setupItemFilters }  from "./itemFilters.js";

/**
 * Compose all filter modules:
 *  - main layer toggles
 *  - chest filters
 *  - NPC hostile/friendly filters
 *  - item-definition filters (async)
 *
 * @param {object} params
 * @param {string} params.mainFiltersSelector
 * @param {string} params.chestFilterListSelector
 * @param {string} params.npcHostileListSelector
 * @param {string} params.npcFriendlyListSelector
 * @param {string} params.itemFilterListSelector
 * @param {firebase.firestore.Firestore} params.db
 * @param {function} params.onChange  – callback to invoke when any filter changes
 * @returns {{
 *   filterMarkers: () => void,
 *   loadItemFilters: () => Promise<void>
 * }}
 */
export function setupSidebarFilters({
  mainFiltersSelector,
  chestFilterListSelector,
  npcHostileListSelector,
  npcFriendlyListSelector,
  itemFilterListSelector,
  db,
  onChange
}) {
  // 1) wire up static filter groups
  setupMainFilters(mainFiltersSelector, onChange);
  setupChestFilters(chestFilterListSelector, onChange);
  setupNpcFilters(npcHostileListSelector, npcFriendlyListSelector, onChange);

  // 2) core filter function (to be called on every change)
  function filterMarkers() {
    // delegate to your existing filterMarkers from initSidebar logic
    onChange();
  }

  // 3) item filters loader
  async function loadItemFilters() {
    await setupItemFilters(itemFilterListSelector, db, onChange);
  }

  return { filterMarkers, loadItemFilters };
}

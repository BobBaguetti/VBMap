// @file: src/bootstrap/definitionsManager.js
// @version: 1.0 — load & subscribe item and chest definitions

import {
  subscribeChestDefinitions
} from "../modules/services/chestDefinitionsService.js";
import {
  subscribeItemDefinitions,
  loadItemDefinitions
} from "../modules/services/itemDefinitionsService.js";

let chestDefMap = {};
let itemDefMap = {};

/**
 * Initialize definition loading and subscriptions.
 * @param {Firestore} db - Firestore database instance
 * @param {Function} loadItemFilters - callback to reload item filters in sidebar
 * @param {Function} filterMarkers - callback to apply current filters to markers
 */
async function init(db, loadItemFilters, filterMarkers) {
  // Subscribe to chest definitions updates
  subscribeChestDefinitions(db, defs => {
    chestDefMap = Object.fromEntries(defs.map(d => [d.id, d]));
  });

  // Load initial item definitions
  const initialDefs = await loadItemDefinitions(db);
  itemDefMap = Object.fromEntries(initialDefs.map(d => [d.id, d]));

  // Subscribe to item definitions updates
  subscribeItemDefinitions(db, async () => {
    const defs = await loadItemDefinitions(db);
    itemDefMap = Object.fromEntries(defs.map(d => [d.id, d]));
    // Refresh filters and reapply marker filtering
    await loadItemFilters();
    filterMarkers();
  });
}

/**
 * Get the current chest definition map.
 * @returns {Object} chestDefMap
 */
function getChestDefMap() {
  return chestDefMap;
}

/**
 * Get the current item definition map.
 * @returns {Object} itemDefMap
 */
function getItemDefMap() {
  return itemDefMap;
}

export default {
  init,
  getChestDefMap,
  getItemDefMap
};

// @file: src/bootstrap/definitionsManager.js
// @version: 1.2 — refine filter rebuild logic to only rebuild item filters on item-definition changes

import { markerTypes } from "../modules/marker/types.js";

const definitionsMap = {};

/**
 * Initialize definition loading and real-time subscriptions
 * for all registered marker types.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {() => Promise<void>} loadItemFilters   – rebuild sidebar item filters
 * @param {() => void}         filterMarkers      – re‐apply current filters to markers
 */
async function init(db, loadItemFilters, filterMarkers) {
  // 1) Subscribe to updates for every marker type
  Object.entries(markerTypes).forEach(([type, cfg]) => {
    cfg.subscribeDefinitions(db, defs => {
      // Update our in‐memory cache
      definitionsMap[type] = Object.fromEntries(defs.map(d => [d.id, d]));

      // Only rebuild the item-filters when Item definitions change
      if (type === "Item") {
        loadItemFilters().then(filterMarkers);
      } else {
        filterMarkers();
      }
    });
  });

  // 2) Load initial definitions for every type
  for (const [type, cfg] of Object.entries(markerTypes)) {
    const defs = await cfg.loadDefinitions(db);
    definitionsMap[type] = Object.fromEntries(defs.map(d => [d.id, d]));
  }

  // 3) Build item filters once and draw initial markers
  await loadItemFilters();
  filterMarkers();
}

/**
 * Retrieve the definition map for a given marker type.
 * @param {string} type  – e.g. "Item", "Chest"
 * @returns {Object<string, Object>} id→definition map
 */
function getDefinitions(type) {
  return definitionsMap[type] || {};
}

/** Convenience accessors for legacy callers */
function getItemDefMap()  { return getDefinitions("Item"); }
function getChestDefMap() { return getDefinitions("Chest"); }

export default {
  init,
  getDefinitions,
  getItemDefMap,
  getChestDefMap
};

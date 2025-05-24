// @file: src/modules/sidebar/sidebarFilters.js
// @version: 1.4 — delegate to modular filters in sidebar/filters/index.js

import { setupSidebarFilters as setupFilters } from "./filters/index.js";

/**
 * Sets up all sidebar filters by delegating to
 * the modular filter setup functions.
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
 *
 * @returns {{ filterMarkers: () => void }}
 */
export function setupSidebarFilters(params) {
  // You can still pass through everything, including
  // layers, allMarkers, and the Firestore db.
  return setupFilters(params);
}
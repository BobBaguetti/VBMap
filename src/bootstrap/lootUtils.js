// @file: src/bootstrap/lootUtils.js
// @version: 1.0 — reusable loot-pool enrichment helper

import definitionsManager from "./definitionsManager.js";

/**
 * Enriches any marker’s lootPool entries from IDs to full definitions.
 *
 * @param {object} data    Marker data object (must have .lootPool)
 * @param {string} defType Definition type for enrichment (e.g. "Item", "NPC")
 */
export function enrichLootPool(data, defType = "Item") {
  if (!Array.isArray(data.lootPool)) return;
  const defMap = definitionsManager.getDefinitions(defType);
  data.lootPool = data.lootPool.map(entry => {
    const id = typeof entry === "string" ? entry : entry.id;
    return defMap[id] || (typeof entry === "object" ? entry : { id });
  });
}
 
// @file: src/modules/initializer/definitionsLoader.js
// @version: 1.0 — centralizes Firestore subscriptions for definitions

import { db }                             from "../../appInit.js";
import { subscribeItemDefinitions }       from "../services/itemDefinitionsService.js";
import { subscribeChestDefinitions }      from "../services/chestDefinitionsService.js";
import { subscribeNPCs }                  from "../services/definitions/npcService.js";

// Live definition maps
export let itemDefMap = {};
export let chestDefMap = {};
export let npcDefMap = {};

/**
 * Initialize all definition subscriptions.
 * Updates the corresponding maps and dispatches events on update.
 */
export function initDefinitions() {
  subscribeItemDefinitions(db, defs => {
    itemDefMap = Object.fromEntries(defs.map(d => [d.id, d]));
    document.dispatchEvent(new Event("definitions:updated:item"));
  });

  subscribeChestDefinitions(db, defs => {
    chestDefMap = Object.fromEntries(defs.map(d => [d.id, d]));
    document.dispatchEvent(new Event("definitions:updated:chest"));
  });

  subscribeNPCs(db, defs => {
    npcDefMap = Object.fromEntries(defs.map(d => [d.id, d]));
    document.dispatchEvent(new Event("definitions:updated:npc"));
  });
}

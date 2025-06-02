// @file: src/modules/definition/form/controller/npcFormEnhancements.js
// @version: 1.0 — wire up lootPool for NPC form using shared helper

import { wireLootPool } from "./wireLootPool.js";

/**
 * Hook to wire the NPC form’s “Loot Pool” chip-list.
 * Must be called after the NPC form is inserted into the DOM.
 *
 * @param {{ form: HTMLFormElement, fields: Object }} args
 */
export function wireNpcLootPool({ form, fields }) {
  // Delegate to shared helper
  wireLootPool({ form, fields });
}

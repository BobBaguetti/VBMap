// @file: /scripts/modules/services/npcDefinitionsService.js
// @version: 2.0 – now uses generic Firestore service factory

import { makeFirestoreService } from "../utils/firestoreServiceFactory.js";

const npcService = makeFirestoreService("npcDefinitions");

/**
 * Load all NPC definitions as an array of {id, ...data}.
 */
export const loadNpcDefinitions = db => npcService.loadAll(db);

/**
 * Subscribe to NPC definitions; callback receives an array on every update.
 * Returns an unsubscribe function.
 */
export const subscribeNpcDefinitions = (db, onUpdate) =>
  npcService.subscribeAll(db, onUpdate);

/**
 * Add a new NPC definition. Returns the added record ({id, ...data}).
 */
export const addNpcDefinition = (db, data) =>
  npcService.add(db, data);

/**
 * Update an existing NPC definition by id. Returns the updated record.
 */
export const updateNpcDefinition = (db, id, data) =>
  npcService.update(db, id, data);

/**
 * Delete an NPC definition by id.
 */
export const deleteNpcDefinition = (db, id) =>
  npcService.remove(db, id);

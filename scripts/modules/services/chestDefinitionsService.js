// @file: /scripts/modules/services/chestDefinitionsService.js
// @version: 2.0 – now uses shared Firestore factory

import { makeFirestoreService } from "../../utils/firestoreServiceFactory.js";

const svc = makeFirestoreService("chestDefinitions");

export const loadChestDefinitions      = svc.loadAll;
export const subscribeChestDefinitions = svc.subscribeAll;
export const saveChestDefinition       = svc.add;
export const updateChestDefinition     = svc.update;
export const deleteChestDefinition     = svc.remove;

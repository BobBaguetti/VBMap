// @file: /scripts/modules/services/itemDefinitionsService.js
// @version: 2.0 – now uses shared Firestore factory

import { makeFirestoreService } from "../../utils/firestoreServiceFactory.js";

const svc = makeFirestoreService("itemDefinitions");

export const loadItemDefinitions      = svc.loadAll;
export const subscribeItemDefinitions = svc.subscribeAll;
export const saveItemDefinition       = svc.add;
export const updateItemDefinition     = svc.update;
export const deleteItemDefinition     = svc.remove;

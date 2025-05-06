// @file: /scripts/modules/ui/modals/chestDefinitionsModal.js
// @version: 1.0 – refactored to use generic definitionsModalFactory

import { createDefinitionsModal }      from "../components/definitionsModalFactory.js";
import * as chestSvc                   from "../../services/chestDefinitionsService.js";
import { createChestFormController }   from "../forms/controllers/chestFormController.js";
import { renderChestEntry }            from "../entries/chestEntryRenderer.js";

/**
 * Initializes the chest definitions modal by delegating all setup to the generic factory.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @returns {{ open(): Promise<void>, refresh(): Promise<void> }}
 */
export function initChestDefinitionsModal(db) {
  return createDefinitionsModal({
    id:                    "chest-definitions-modal",
    title:                 "Manage Chest Types",
    previewType:           "chest",
    db,
    loadDefs:              () => chestSvc.loadChestDefinitions(db),
    saveDef:               (database, id, payload) => chestSvc.saveChestDefinition(database, id, payload),
    updateDef:             (database, id, payload) => chestSvc.updateChestDefinition(database, id, payload),
    deleteDef:             (database, id) => chestSvc.deleteChestDefinition(database, id),
    createFormController:  callbacks => createChestFormController(callbacks, db),
    renderEntry:           renderChestEntry
  });
}

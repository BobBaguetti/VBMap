// @file: /scripts/modules/ui/modals/itemDefinitionsModal.js
// @version: 1.0 – refactored to use generic definitionsModalFactory

import { createDefinitionsModal }     from "../components/definitionsModalFactory.js";
import * as itemSvc                   from "../../services/itemDefinitionsService.js";
import { createItemFormController }   from "../forms/controllers/itemFormController.js";
import { renderItemEntry }            from "../entries/itemEntryRenderer.js";

/**
 * Initializes the item definitions modal by delegating all setup to the generic factory.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @returns {{ open(): Promise<void>, refresh(): Promise<void> }}
 */
export function initItemDefinitionsModal(db) {
  return createDefinitionsModal({
    id:                    "item-definitions-modal",
    title:                 "Manage Items",
    previewType:           "item",
    db,
    loadDefs:              () => itemSvc.loadItemDefinitions(db),
    saveDef:               (database, id, payload) => itemSvc.saveItemDefinition(database, id, payload),
    updateDef:             (database, id, payload) => itemSvc.updateItemDefinition(database, id, payload),
    deleteDef:             (database, id) => itemSvc.deleteItemDefinition(database, id),
    createFormController:  callbacks => createItemFormController(callbacks),
    renderEntry:           renderItemEntry
  });
}

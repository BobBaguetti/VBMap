// @file: /scripts/modules/ui/modals/itemDefinitionsModal.js
// @version: 1.0 – migrate to createDefinitionsModal + schemaFormController

import { createDefinitionsModal } from "../components/definitionsModalFactory.js";
import itemSchema from "../forms/schemas/itemSchema.js";
import { createSchemaFormController } from "../components/schemaFormBuilder.js";

import {
  loadItemDefinitions,
  saveItemDefinition,
  updateItemDefinition,
  deleteItemDefinition,
  subscribeItemDefinitions
} from "../../services/itemDefinitionsService.js";

import { renderItemEntry } from "../entries/itemEntryRenderer.js";

export function initItemDefinitionsModal(db) {
  return createDefinitionsModal({
    id:           "item-definitions-modal",
    title:        "Manage Items",
    previewType:  "item",
    db,
    loadDefs:     () => loadItemDefinitions(db),
    saveDef:      (db, id, payload) => saveItemDefinition(db, id, payload),
    updateDef:    (db, id, payload) => updateItemDefinition(db, id, payload),
    deleteDef:    (db, id)         => deleteItemDefinition(db, id),
    subscribeDefs: cb               => subscribeItemDefinitions(db, cb),
    createFormController: callbacks =>
      createSchemaFormController(itemSchema, db, callbacks),
    renderEntry:  (def, layout, callbacks) =>
      renderItemEntry(def, layout, callbacks)
  });
}

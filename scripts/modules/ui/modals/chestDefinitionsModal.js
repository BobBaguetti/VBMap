// @file: /scripts/modules/ui/modals/chestDefinitionsModal.js
// @version: 1.0 – migrate to createDefinitionsModal + schemaFormController

import { createDefinitionsModal } from "../components/definitionsModalFactory.js";
import chestSchema from "../forms/schemas/chestSchema.js";
import { createSchemaFormController } from "../components/schemaFormBuilder.js";

import {
  loadChestDefinitions,
  saveChestDefinition,
  updateChestDefinition,
  deleteChestDefinition,
  subscribeChestDefinitions
} from "../../services/chestDefinitionsService.js";

import { renderChestEntry } from "../entries/chestEntryRenderer.js";

export function initChestDefinitionsModal(db) {
  return createDefinitionsModal({
    id:           "chest-definitions-modal",
    title:        "Manage Chest Types",
    previewType:  "chest",
    db,
    loadDefs:     () => loadChestDefinitions(db),
    saveDef:      (db, id, payload) => saveChestDefinition(db, id, payload),
    updateDef:    (db, id, payload) => updateChestDefinition(db, id, payload),
    deleteDef:    (db, id)         => deleteChestDefinition(db, id),
    subscribeDefs: cb               => subscribeChestDefinitions(db, cb),
    createFormController: callbacks =>
      createSchemaFormController(chestSchema, db, callbacks),
    renderEntry:  (def, layout, callbacks) =>
      renderChestEntry(def, layout, callbacks)
  });
}

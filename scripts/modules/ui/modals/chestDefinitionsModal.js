// @file: scripts/modules/ui/modals/chestDefinitionsModal.js
// @version: 1

import { createDefinitionModal }      from "../modalFactory/index.js";
import { chestFields }                from "../modalSchemas/chestFields.js";
import {
  loadChestDefinitions,
  saveChestDefinition,
  updateChestDefinition,
  deleteChestDefinition
} from "../../services/chestDefinitionsService.js";

/**
 * Factory for the Chest Definitions modal.
 * @param {import("firebase/firestore").Firestore} db
 */
export function initChestDefinitionsModal(db) {
  return createDefinitionModal({
    id:     "chest-definitions-modal",
    title:  "Manage Chest Types",
    schema: chestFields,
    // load the list of existing chest defs
    loadFn: () => loadChestDefinitions(db),
    // on save, either update or create
    saveFn: async (payload) => {
      if (payload.id) {
        await updateChestDefinition(db, payload.id, payload);
      } else {
        await saveChestDefinition(db, null, payload);
      }
    },
    // on delete, remove by ID
    deleteFn: async (id) => {
      await deleteChestDefinition(db, id);
    }
  });
}

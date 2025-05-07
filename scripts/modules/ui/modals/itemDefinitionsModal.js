// @file: scripts/modules/ui/modals/itemDefinitionsModal.js
// @version: 1

import { createDefinitionModal } from "../modalFactory/index.js";
import { itemFields }            from "../modalSchemas/itemFields.js";
import {
  loadItemDefinitions,
  saveItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
} from "../../services/itemDefinitionsService.js";
import { applyColorPresets }     from "../../utils/colorUtils.js";

/**
 * Factory for the Item Definitions modal.
 * @param {import("firebase/firestore").Firestore} db
 */
export function initItemDefinitionsModal(db) {
  return createDefinitionModal({
    id:     "item-definitions-modal",
    title:  "Manage Items",
    schema: itemFields,
    // load the list of existing item defs
    loadFn: () => loadItemDefinitions(db),
    // on save, apply color presets then upsert
    saveFn: async (payload) => {
      applyColorPresets(payload);
      if (payload.id) {
        await updateItemDefinition(db, payload.id, payload);
      } else {
        await saveItemDefinition(db, null, payload);
      }
    },
    // on delete, remove by ID
    deleteFn: async (id) => {
      await deleteItemDefinition(db, id);
    }
  });
}

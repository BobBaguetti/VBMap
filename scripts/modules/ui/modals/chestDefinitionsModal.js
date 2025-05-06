// @file: /scripts/modules/ui/modals/chestDefinitionsModal.js
// @version: 1.1 – updated to use formSchema for standardized fields

import { createDefinitionsModal }      from "../components/definitionsModalFactory.js";
import * as chestSvc                   from "../../services/chestDefinitionsService.js";
import { createChestFormController }   from "../forms/controllers/chestFormController.js";
import { renderChestEntry }            from "../entries/chestEntryRenderer.js";

/**
 * Initializes the chest definitions modal with standardized form fields.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @returns {{ open(): Promise<void>, refresh(): Promise<void> }}
 */
export function initChestDefinitionsModal(db) {
  return createDefinitionsModal({
    id:                   "chest-definitions-modal",
    title:                "Manage Chest Types",
    previewType:          "chest",
    db,
    loadDefs:             () => chestSvc.loadChestDefinitions(db),
    saveDef:              (database, id, payload) => chestSvc.saveChestDefinition(database, id, payload),
    updateDef:            (database, id, payload) => chestSvc.updateChestDefinition(database, id, payload),
    deleteDef:            (database, id) => chestSvc.deleteChestDefinition(database, id),
    createFormController: callbacks => createChestFormController(callbacks, db),
    renderEntry:          renderChestEntry,

    // standardize which form fields to include
    formSchema: {
      name:            true,   // Name field
      imageUrls:       true,   // Image S/L URL fields
      description:     true,   // Description textarea + color swatch
      extraInfo:       true,   // Dynamic extra info rows
      filterToggle:    false,  // no “Add to filters” for chests
      inventoryPicker: true,   // Loot pool chips + picker
      types:           true,   // Size/category selects
      rarities:        false   // no rarity for chests
    }
  });
}

// @file: /scripts/modules/ui/modals/itemDefinitionsModal.js
// @version: 1.2 – updated to use formSchema for standardized fields

import { createDefinitionsModal }     from "../components/definitionsModalFactory.js";
import * as itemSvc                   from "../../services/itemDefinitionsService.js";
import { createItemFormController }   from "../forms/controllers/itemFormController.js";
import { renderItemEntry }            from "../entries/itemEntryRenderer.js";

/**
 * Initializes the item definitions modal with standardized form fields.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @returns {{ open(): Promise<void>, refresh(): Promise<void> }}
 */
export function initItemDefinitionsModal(db) {
  return createDefinitionsModal({
    id:                   "item-definitions-modal",
    title:                "Manage Items",
    previewType:          "item",
    db,
    loadDefs:             () => itemSvc.loadItemDefinitions(db),
    saveDef:              (database, id, payload) => itemSvc.saveItemDefinition(database, id, payload),
    updateDef:            (database, id, payload) => itemSvc.updateItemDefinition(database, id, payload),
    deleteDef:            (database, id) => itemSvc.deleteItemDefinition(database, id),
    createFormController: callbacks => createItemFormController(callbacks),
    renderEntry:          renderItemEntry,

    // standardize which form fields to include
    formSchema: {
      name:            true,   // Name field
      imageUrls:       true,   // Image S/L URL fields
      description:     true,   // Description textarea + color swatch
      extraInfo:       true,   // Dynamic extra info rows
      filterToggle:    true,   // “Add to filters” checkbox
      inventoryPicker: false,  // no loot-pool chips for items
      types:           true,   // Item type select
      rarities:        true    // Rarity select
    }
  });
}

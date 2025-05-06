// @file: /scripts/modules/ui/modals/itemDefinitionsModal.js
// @version: 29.0 – now uses createDefinitionsModal

import { createDefinitionsModal }    from "../components/definitionsModalFactory.js";
import itemSchema                     from "../forms/schemas/itemSchema.js";
import { createItemFormController }   from "../forms/controllers/itemFormController.js";
import { renderItemEntry }            from "../entries/itemEntryRenderer.js";
import { makeFirestoreService }       from "../../utils/firestoreServiceFactory.js";
import { createPreviewPanel }         from "../preview/createPreviewPanel.js";

const itemService = makeFirestoreService("itemDefinitions");

export function initItemDefinitionsModal(db) {
  return createDefinitionsModal({
    id:            "item-definitions",
    title:         "Manage Items",
    previewType:   "item",
    db,

    loadDefs:      () => itemService.loadAll(db),
    subscribeDefs: cb => itemService.subscribeAll(db, cb),
    saveDef:       (db, _, payload) => itemService.add(db, payload),
    updateDef:     (db, id, payload) => itemService.update(db, id, payload),
    deleteDef:     (db, id) => itemService.remove(db, id),

    createFormController: callbacks => createSchemaFormController(itemSchema, callbacks),
    renderEntry:          (def, layout, { onClick, onDelete }) =>
                           renderItemEntry(def, layout, onClick, onDelete),

    enhanceHeader: header => {
      // Optional header tweaks
    }
  });
}

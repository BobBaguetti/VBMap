// @file: /scripts/modules/ui/modals/chestDefinitionsModal.js
// @version: 4.0 – now uses createDefinitionsModal

import { createDefinitionsModal }    from "../components/definitionsModalFactory.js";
import chestSchema                    from "../forms/schemas/chestSchema.js";
import { createChestFormController }  from "../forms/controllers/chestFormController.js";
import { renderChestEntry }           from "../entries/chestEntryRenderer.js";
import { makeFirestoreService }       from "../../utils/firestoreServiceFactory.js";
import { createPreviewPanel }         from "../preview/createPreviewPanel.js";

const chestService = makeFirestoreService("chestDefinitions");

export function initChestDefinitionsModal(db) {
  return createDefinitionsModal({
    id:            "chest-definitions",
    title:         "Manage Chest Types",
    previewType:   "chest",
    db,

    loadDefs:      () => chestService.loadAll(db),
    subscribeDefs: cb => chestService.subscribeAll(db, cb),
    saveDef:       (db, _, payload) => chestService.add(db, payload),
    updateDef:     (db, id, payload) => chestService.update(db, id, payload),
    deleteDef:     (db, id) => chestService.remove(db, id),

    createFormController: callbacks => createSchemaFormController(chestSchema, callbacks),
    renderEntry:          (def, layout, { onClick, onDelete }) =>
                           renderChestEntry(def, layout, onClick, onDelete),

    enhanceHeader: header => {
      // Optional: you can still position your preview panel or adjust header
    }
  });
}

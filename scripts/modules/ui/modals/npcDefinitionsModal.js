// @file: /scripts/modules/ui/modals/npcDefinitionsModal.js
// @version: 3.3 – align renderEntry signature to (def, layout, {onClick,onDelete})

import { initCrudModal }            from "../../utils/crudModalFactory.js";
import {
  loadNpcDefinitions,
  subscribeNpcDefinitions,
  addNpcDefinition,
  updateNpcDefinition,
  deleteNpcDefinition
}                                    from "../../services/npcDefinitionsService.js";
import { createNpcFormController }  from "../forms/controllers/npcFormController.js";
import { renderNpcEntry }           from "../entries/npcEntryRenderer.js";

export function initNpcDefinitionsModal(db) {
  return initCrudModal({
    id:            "npc-definitions-modal",
    title:         "Manage NPCs",
    toolbar:       ["list", "form", "preview", "search"],
    db,
    loadAll:       () => loadNpcDefinitions(db),
    subscribeAll:  cb => subscribeNpcDefinitions(db, cb),
    onSave:        def =>
                     def.id
                       ? updateNpcDefinition(db, def.id, def)
                       : addNpcDefinition(db, def),
    onDelete:      id => deleteNpcDefinition(db, id),

    // <-- updated to accept (def, layout, {onClick,onDelete})
    renderEntry:   (def, layout, { onClick, onDelete }) =>
                     renderNpcEntry(def, layout, { onClick, onDelete }),

    formFactory:   createNpcFormController,
    previewType:   "npc",
    layoutOptions: ["row", "stacked", "gallery"]
  });
}

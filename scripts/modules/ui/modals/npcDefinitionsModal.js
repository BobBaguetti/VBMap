// @file: /scripts/modules/ui/modals/npcDefinitionsModal.js
// @version: 3.5 – pass renderEntry directly for full styling

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

    // <-- simplified to pass renderNpcEntry straight through
    renderEntry:   renderNpcEntry,

    formFactory:   createNpcFormController,
    previewType:   "npc",
    layoutOptions: ["row", "stacked", "gallery"]
  });
}

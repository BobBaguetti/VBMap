// @file: /scripts/modules/ui/modals/npcDefinitionsModal.js
// @version: 5

import { createDefinitionModalShell } from "../components/definitionModalShell.js";
import { createDefListContainer } from "../../utils/listUtils.js";
import {
  loadNpcDefinitions, saveNpcDefinition, updateNpcDefinition,
  deleteNpcDefinition
} from "../../services/npcDefinitionsService.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createNpcFormController } from "../forms/controllers/npcFormController.js";
import { renderNpcEntry } from "../entries/npcEntryRenderer.js";

export function initNpcDefinitionsModal(db) {
  const {
    modal, header, bodyWrap, previewApi, open: openModal
  } = createDefinitionModalShell({
    id: "npc-definitions-modal",
    title: "Manage NPCs",
    withPreview: true,
    previewType: "npc",
    layoutOptions: ["row","stacked","gallery"],
    onClose: () => previewApi.hide()
  });

  const listContainer = createDefListContainer("npc-def-list");
  bodyWrap.appendChild(listContainer);

  const formApi = createNpcFormController({
    onCancel: () => { formApi.reset(); },
    onDelete: async id => { await deleteNpcDefinition(db,id); formApi.reset(); refresh(); },
    onSubmit: async payload => {
      if (payload.id) await updateNpcDefinition(db,payload.id,payload);
      else await saveNpcDefinition(db,null,payload);
      formApi.reset(); refresh();
    }
  });
  formApi.form.classList.add("ui-scroll-float");
  bodyWrap.appendChild(document.createElement("hr"));
  bodyWrap.appendChild(formApi.form);

  let definitions = [];
  const listApi = createDefinitionListManager({
    container: listContainer,
    getDefinitions: () => definitions,
    renderEntry: (d,layout) => renderNpcEntry(d,layout,{
      onClick:def=>{ formApi.populate(def); previewApi.setFromDefinition(def); previewApi.show(); },
      onDelete:id=>{ deleteNpcDefinition(db,id).then(refresh); }
    })
  });

  async function refresh() {
    definitions = await loadNpcDefinitions(db);
    listApi.refresh(definitions);
  }

  return {
    open: async () => { formApi.reset(); await refresh(); openModal(); },
    refresh
  };
}

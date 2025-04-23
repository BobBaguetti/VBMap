// @file: /scripts/modules/ui/modals/questDefinitionsModal.js
// @version: 5

import { createDefinitionModalShell } from "../components/definitionModalShell.js";
import { createDefListContainer } from "../../utils/listUtils.js";
import {
  loadQuestDefinitions, saveQuestDefinition, updateQuestDefinition,
  deleteQuestDefinition
} from "../../services/questDefinitionsService.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createQuestFormController } from "../forms/controllers/questFormController.js";
import { renderQuestEntry } from "../entries/questEntryRenderer.js";

export function initQuestDefinitionsModal(db) {
  const {
    modal, header, bodyWrap, previewApi, open: openModal
  } = createDefinitionModalShell({
    id: "quest-definitions-modal",
    title: "Manage Quests",
    withPreview: true,
    previewType: "quest",
    layoutOptions: ["row","stacked","gallery"],
    onClose: () => previewApi.hide()
  });

  const listContainer = createDefListContainer("quest-def-list");
  bodyWrap.appendChild(listContainer);

  const formApi = createQuestFormController({
    onCancel: () => { formApi.reset(); },
    onDelete: async id => { await deleteQuestDefinition(db,id); formApi.reset(); refresh(); },
    onSubmit: async payload => {
      if (payload.id) await updateQuestDefinition(db,payload.id,payload);
      else await saveQuestDefinition(db,null,payload);
      formApi.reset(); refresh();
    }
  });
  formApi.form.classList.add("ui-scroll-float");
  bodyWrap.appendChild(document.createElement("hr"));
  // only append the form (includes its own header+buttons)
  bodyWrap.appendChild(formApi.form);

  let definitions = [];
  const listApi = createDefinitionListManager({
    container: listContainer,
    getDefinitions: () => definitions,
    renderEntry: (d,layout) => renderQuestEntry(d,layout,{
      onClick:def=>{ formApi.populate(def); previewApi.setFromDefinition(def); previewApi.show(); },
      onDelete:id=>{ deleteQuestDefinition(db,id).then(refresh); }
    })
  });

  async function refresh() {
    definitions = await loadQuestDefinitions(db);
    listApi.refresh(definitions);
  }

  return {
    open: async () => { formApi.reset(); await refresh(); openModal(); },
    refresh
  };
}

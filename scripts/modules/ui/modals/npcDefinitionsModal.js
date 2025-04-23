// @file: /scripts/modules/ui/modals/npcDefinitionsModal.js

import { createDefinitionModalShell } from "../components/definitionModalShell.js";
import { createDefListContainer } from "../../utils/listUtils.js";
import { createDefinitionListManager } from "../../utils/definitionListManager.js";
import { createNpcFormController } from "../forms/npcFormController.js";
import { loadNpcDefinitions, deleteNpcDefinition, subscribeNpcDefinitions } from "../../services/npcDefinitionsService.js";

export function initNpcDefinitionsModal(db) {
  const {
    modal,
    header,
    bodyWrap,
    layoutSwitcher,
    previewApi,
    open,
    close
  } = createDefinitionModalShell({
    id: "npc-definitions-modal",
    title: "Manage NPCs",
    withPreview: true,
    previewType: "npc",
    layoutOptions: ["row", "stacked"],
    onClose: () => previewApi?.hide()
  });

  const listContainer = createDefListContainer("npc-def-list");
  bodyWrap.appendChild(listContainer);

  const formApi = createNpcFormController({
    onCancel: () => formApi.reset(),
    onDelete: async (id) => {
      await deleteNpcDefinition(db, id);
      await refreshDefinitions();
      formApi.reset();
    },
    onSubmit: async (payload) => {
      // Add your save/update logic here
      await refreshDefinitions();
      formApi.reset();
    }
  });

  bodyWrap.appendChild(document.createElement("hr"));
  bodyWrap.appendChild(formApi.form);

  let definitions = [];

  const listApi = createDefinitionListManager({
    container: listContainer,
    getDefinitions: () => definitions,
    onEntryClick: def => {
      formApi.populate(def);
      previewApi.setFromDefinition(def);
      previewApi.show();
    },
    onDelete: async id => {
      await deleteNpcDefinition(db, id);
      await refreshDefinitions();
    }
  });

  async function refreshDefinitions() {
    definitions = await loadNpcDefinitions(db);
    listApi.refresh(definitions);
  }

  subscribeNpcDefinitions(db, defs => {
    definitions = defs;
    listApi.refresh(defs);
  });

  return {
    open: async () => {
      formApi.reset();
      await refreshDefinitions();
      open();
      formApi.initPickrs?.();
    },
    refresh: refreshDefinitions
  };
}

// @version: 2
// @file: /scripts/modules/ui/modals/questDefinitionsModal.js

import { createDefinitionModalShell } from "../components/definitionModalShell.js";
import { createDefListContainer } from "../../utils/listUtils.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createQuestFormController } from "../forms/controllers/questFormController.js";
import { renderQuestEntry } from "../entries/questEntryRenderer.js";
import {
  loadQuestDefinitions,
  deleteQuestDefinition,
  subscribeQuestDefinitions
} from "../../services/questDefinitionsService.js";

export function initQuestDefinitionsModal(db) {
  const {
    modal,
    header,
    bodyWrap,
    layoutSwitcher,
    previewApi,
    open,
    close
  } = createDefinitionModalShell({
    id: "quest-definitions-modal",
    title: "Manage Quests",
    withPreview: true,
    previewType: "quest",
    layoutOptions: ["row", "stacked"],
    onClose: () => previewApi?.hide()
  });

  const listContainer = createDefListContainer("quest-def-list");
  bodyWrap.appendChild(listContainer);

  const formApi = createQuestFormController({
    onCancel: () => formApi.reset(),
    onDelete: async (id) => {
      await deleteQuestDefinition(db, id);
      await refreshDefinitions();
      formApi.reset();
    },
    onSubmit: async (payload) => {
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
    renderEntry: (def, layout) => renderQuestEntry(def, layout, {
      onClick: (d) => {
        formApi.populate(d);
        previewApi.setFromDefinition(d);
        previewApi.show();
      },
      onDelete: async (id) => {
        await deleteQuestDefinition(db, id);
        await refreshDefinitions();
      }
    })
  });

  async function refreshDefinitions() {
    definitions = await loadQuestDefinitions(db);
    listApi.refresh(definitions);
  }

  subscribeQuestDefinitions(db, defs => {
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

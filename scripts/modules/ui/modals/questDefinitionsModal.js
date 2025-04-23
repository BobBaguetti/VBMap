// @version: 2
// @file: /scripts/modules/ui/modals/questDefinitionsModal.js

import { createDefinitionModalShell } from "../components/definitionModalShell.js";
import { createDefListContainer } from "../../utils/listUtils.js";
import {
  loadQuestDefinitions, saveQuestDefinition, updateQuestDefinition,
  deleteQuestDefinition, subscribeQuestDefinitions
} from "../../services/questDefinitionsService.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createQuestFormController } from "../forms/controllers/questFormController.js";
import { renderQuestEntry } from "../entries/questEntryRenderer.js";

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
    layoutOptions: ["row", "stacked", "gallery"],
    onClose: () => previewApi?.hide()
  });

  const listContainer = createDefListContainer("quest-def-list");
  bodyWrap.appendChild(listContainer);

  const formApi = createQuestFormController({
    onCancel: () => {
      formApi.reset();
      const def = formApi.getCustom?.();
      if (def) previewApi.setFromDefinition(def);
    },
    onDelete: async (idToDelete) => {
      await deleteQuestDefinition(db, idToDelete);
      await refreshDefinitions();
      formApi.reset();
    },
    onSubmit: async (payload) => {
      if (payload.id) {
        await updateQuestDefinition(db, payload.id, payload);
      } else {
        await saveQuestDefinition(db, null, payload);
      }
      await refreshDefinitions();
      formApi.reset();
    }
  });

  formApi.form.classList.add("ui-scroll-float");

  formApi.form.addEventListener("input", () => {
    const live = formApi.getCustom?.();
    if (live) {
      previewApi.setFromDefinition(live);
      previewApi.show();
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

  function positionPreviewPanel() {
    const modalRect = modal.querySelector(".modal-content")?.getBoundingClientRect();
    const previewEl = previewApi.container;
    const previewRect = previewEl.getBoundingClientRect();
    if (modalRect) {
      previewEl.style.position = "absolute";
      previewEl.style.left = `${modalRect.right + 30}px`;
      previewEl.style.top = `${modalRect.top + (modalRect.height / 2) - (previewRect.height / 2)}px`;
    }
  }

  previewApi.hide(); // Prevent showing preview on page load

  return {
    open: async () => {
      formApi.reset();
      await refreshDefinitions();
      open();
      positionPreviewPanel();
      const def = formApi.getCustom?.();
      if (def) previewApi.setFromDefinition(def);
      previewApi.show();
      formApi.initPickrs?.();
    },
    refresh: refreshDefinitions
  };
}

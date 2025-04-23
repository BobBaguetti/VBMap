// @version: 10
// @file: /scripts/modules/ui/modals/testItemDefinitionsModal.js

import { createDefinitionModalShell } from "../components/definitionModalShell.js";
import { createDefListContainer } from "../../utils/listUtils.js";
import {
  loadItemDefinitions, saveItemDefinition, updateItemDefinition,
  deleteItemDefinition, subscribeItemDefinitions
} from "../../services/itemDefinitionsService.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { applyColorPresets } from "../../utils/colorUtils.js";
import { createItemFormController } from "../forms/controllers/itemFormController.js";
import { renderItemEntry } from "../entries/itemEntryRenderer.js";

export function initTestItemDefinitionsModal(db) {
  const {
    modal,
    header,
    bodyWrap,
    layoutSwitcher,
    previewApi,
    open,
    close
  } = createDefinitionModalShell({
    id: "test-item-definitions-modal",
    title: "Manage Items (Test)",
    withPreview: true,
    previewType: "item",
    layoutOptions: ["row", "stacked", "gallery"],
    onClose: () => previewApi?.hide()
  });

  const listContainer = createDefListContainer("test-item-def-list");
  bodyWrap.appendChild(listContainer);

  const formApi = createItemFormController({
    onCancel: () => {
      formApi.reset();
      const def = formApi.getCustom?.();
      if (def) previewApi.setFromDefinition(def);
    },
    onDelete: async (idToDelete) => {
      await deleteItemDefinition(db, idToDelete);
      await refreshDefinitions();
      formApi.reset();
    },
    onSubmit: async (payload) => {
      applyColorPresets(payload);
      if (payload.id) {
        await updateItemDefinition(db, payload.id, payload);
      } else {
        await saveItemDefinition(db, null, payload);
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
    renderEntry: (def, layout) => renderItemEntry(def, layout, {
      onClick: (d) => {
        formApi.populate(d);
        previewApi.setFromDefinition(d);
        previewApi.show();
      },
      onDelete: async (id) => {
        await deleteItemDefinition(db, id);
        await refreshDefinitions();
      }
    })
  });

  async function refreshDefinitions() {
    definitions = await loadItemDefinitions(db);
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

  previewApi.hide(); // Hide at startup before modal opens

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

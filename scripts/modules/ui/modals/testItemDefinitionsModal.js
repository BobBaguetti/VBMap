// @version: 7
// @file: /scripts/modules/ui/modals/testItemDefinitionsModal.js

import {
    createModal, closeModal, openModal
  } from "../uiKit.js";
  
  import { createDefListContainer } from "../../utils/listUtils.js";
  import {
    loadItemDefinitions, saveItemDefinition, updateItemDefinition,
    deleteItemDefinition, subscribeItemDefinitions
  } from "../../services/itemDefinitionsService.js";
  
  import { createLayoutSwitcher } from "../uiKit.js";
  import { createItemPreviewPanel } from "../preview/itemPreview.js";
  import { createDefinitionListManager } from "../../utils/definitionListManager.js";
  import { applyColorPresets } from "../../utils/colorUtils.js";
  import { createItemFormController } from "../forms/itemFormController.js";
  
  export function initTestItemDefinitionsModal(db) {
    const { modal, content, header } = createModal({
      id: "test-item-definitions-modal",
      title: "Manage Items (Test)",
      size: "large",
      backdrop: true,
      draggable: false,
      withDivider: true,
      onClose: () => {
        closeModal(modal);
        previewApi.hide();
      }
    });
  
    const layoutSwitcher = createLayoutSwitcher({
      available: ["row", "stacked", "gallery"],
      defaultView: "row",
      onChange: layout => listApi.setLayout(layout)
    });
    header.appendChild(layoutSwitcher);
  
    const listContainer = createDefListContainer("test-item-def-list");
    const previewPanel = document.createElement("div");
    previewPanel.style.zIndex = 1101;
    document.body.appendChild(previewPanel);
    const previewApi = createItemPreviewPanel(previewPanel);
  
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
  
    const bodyWrap = document.createElement("div");
    bodyWrap.style.display = "flex";
    bodyWrap.style.flexDirection = "column";
    bodyWrap.style.flex = "1 1 auto";
    bodyWrap.style.minHeight = 0;
  
    bodyWrap.appendChild(listContainer);
  
    const listApi = createDefinitionListManager({
      container: listContainer,
      getDefinitions: () => definitions,
      onEntryClick: def => {
        formApi.populate(def);
        previewApi.setFromDefinition(def);
        previewApi.show();
      },
      onDelete: async id => {
        await deleteItemDefinition(db, id);
        await refreshDefinitions();
      }
    });
  
    bodyWrap.appendChild(document.createElement("hr"));
    bodyWrap.appendChild(formApi.form);
    content.appendChild(bodyWrap);
  
    let definitions = [];
  
    async function refreshDefinitions() {
      definitions = await loadItemDefinitions(db);
      listApi.refresh(definitions);
    }
  
    subscribeItemDefinitions(db, defs => {
      definitions = defs;
      listApi.refresh(defs);
    });
  
    return {
      open: async () => {
        formApi.reset();
        await refreshDefinitions();
        openModal(modal);
  
        const modalRect = modal.querySelector(".modal-content")?.getBoundingClientRect();
        const previewRect = previewPanel.getBoundingClientRect();
        if (modalRect) {
          previewPanel.style.left = `${modalRect.right + 30}px`;
          previewPanel.style.top = `${modalRect.top + (modalRect.height / 2) - (previewRect.height / 2)}px`;
          previewPanel.style.position = "absolute";
        }
  
        const def = formApi.getCustom?.();
        if (def) previewApi.setFromDefinition(def);
        previewApi.show();
  
        formApi.initPickrs(); // 🔧 Ensures pickrs are initialized once form is rendered
      },
      refresh: refreshDefinitions
    };
  }
  
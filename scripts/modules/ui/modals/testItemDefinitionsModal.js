// Updated test modal file with button alignment and layout changes
// @file: /scripts/modules/ui/modals/testItemDefinitionsModal.js
// @version: 13

import {
  createModal, closeModal, openModal
} from "../uiKit.js";

import { createDefListContainer } from "../../utils/listUtils.js";
import {
  loadItemDefinitions, saveItemDefinition, updateItemDefinition,
  deleteItemDefinition, subscribeItemDefinitions
} from "../../services/itemDefinitionsService.js";

import { createLayoutSwitcher } from "../uiKit.js";
import { createPreviewPanel } from "../preview/createPreviewPanel.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { applyColorPresets } from "../../utils/colorUtils.js";
import { createItemFormController } from "../forms/controllers/itemFormController.js";

// Modifications for top-right button placement in modal subheader
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

  // Top-right button alignment
  const subheadingWrap = document.createElement("div");
  subheadingWrap.style.display = "flex";
  subheadingWrap.style.justifyContent = "space-between";
  subheadingWrap.style.alignItems = "center";

  const subheading = document.createElement("h3");
  subheading.textContent = "Add Item";
  subheadingWrap.appendChild(subheading);

  const buttonRow = document.createElement("div");
  buttonRow.className = "floating-buttons";

  const btnSave = document.createElement("button");
  btnSave.type = "submit";
  btnSave.className = "ui-button";
  btnSave.textContent = "Save";

  const btnClear = document.createElement("button");
  btnClear.type = "button";
  btnClear.className = "ui-button";
  btnClear.textContent = "Clear";
  btnClear.onclick = () => { /* Clear action */ };

  const btnDelete = document.createElement("button");
  btnDelete.type = "button";
  btnDelete.className = "ui-button-delete";
  btnDelete.title = "Delete this item";
  btnDelete.style.width = "28px";
  btnDelete.style.height = "28px";
  btnDelete.appendChild(createIcon("trash"));
  btnDelete.onclick = () => { /* Delete action */ };

  buttonRow.append(btnSave, btnClear, btnDelete);
  subheadingWrap.appendChild(buttonRow);
  formApi.form.prepend(subheadingWrap);

  const listContainer = createDefListContainer("test-item-def-list");
  const previewApi = createPreviewPanel("item");

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
  bodyWrap.appendChild(document.createElement("hr"));

  // Append form with button row at top
  const formWrap = document.createElement("div");
  formWrap.appendChild(formApi.buttonRow);
  formWrap.appendChild(formApi.form);
  bodyWrap.appendChild(formWrap);

  content.appendChild(bodyWrap);

  const listApi = createDefinitionListManager({
    container: listContainer,
    getDefinitions: () => definitions,
    onEntryClick: def => {
      formApi.populate(def);
      previewApi.setFromDefinition(def);
      previewApi.show();
    },
    onDelete: async (id) => {
      await deleteItemDefinition(db, id);
      await refreshDefinitions();
    }
  });

  let definitions = [];

  async function refreshDefinitions() {
    definitions = await loadItemDefinitions(db);
    listApi.refresh(definitions);
  }

  function positionPreviewPanel() {
    if (!modal || !previewApi?.container) return;

    const modalContent = modal.querySelector(".modal-content");
    if (!modalContent) return;

    const previewEl = previewApi.container;
    const modalRect = modalContent.getBoundingClientRect();

    previewEl.style.position = "absolute";
    previewEl.style.left = `${modalRect.right + 30}px`;

    requestAnimationFrame(() => {
      const previewHeight = previewEl.offsetHeight;
      const modalCenterY = modalRect.top + (modalRect.height / 2);
      previewEl.style.top = `${modalCenterY - (previewHeight / 2)}px`;
    });
  }

  previewApi.hide();

  return {
    open: async () => {
      formApi.reset();
      await refreshDefinitions();
      openModal(modal);

      requestAnimationFrame(() => {
        positionPreviewPanel();
        previewApi.show();
      });

      const def = formApi.getCustom?.();
      if (def) previewApi.setFromDefinition(def);

      formApi.initPickrs?.();
    },
    refresh: refreshDefinitions
  };
}

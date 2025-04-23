// Updated quest modal file with button alignment and layout changes
// @file: /scripts/modules/ui/modals/questDefinitionsModal.js

import { createDefinitionModalShell } from "../components/definitionModalShell.js";
import { createDefListContainer } from "../../utils/listUtils.js";
import {
  loadQuestDefinitions, saveQuestDefinition, updateQuestDefinition,
  deleteQuestDefinition
} from "../../services/questDefinitionsService.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createQuestFormController } from "../forms/controllers/questFormController.js";
import { renderQuestEntry } from "../entries/questEntryRenderer.js";
import { createIcon } from "../../utils/iconUtils.js"; 

// Modifications for top-right button placement in modal subheader
export function initQuestDefinitionsModal(db) {
  const {
    modal,
    header,
    bodyWrap,
    layoutSwitcher,
    previewApi,
    open: openModal,
    close
  } = createDefinitionModalShell({
    id: "quest-definitions-modal",
    title: "Manage Quests",
    withPreview: true,
    previewType: "quest",
    layoutOptions: ["row", "stacked", "gallery"],
    onClose: () => previewApi?.hide()
  });

  // Top-right button alignment
  const subheadingWrap = document.createElement("div");
  subheadingWrap.style.display = "flex";
  subheadingWrap.style.justifyContent = "space-between";
  subheadingWrap.style.alignItems = "center";

  const subheading = document.createElement("h3");
  subheading.textContent = "Add Quest";
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
  btnDelete.title = "Delete this quest";
  btnDelete.style.width = "28px";
  btnDelete.style.height = "28px";
  btnDelete.appendChild(createIcon("trash"));
  btnDelete.onclick = () => { /* Delete action */ };

  buttonRow.append(btnSave, btnClear, btnDelete);
  subheadingWrap.appendChild(buttonRow);
  formApi.form.prepend(subheadingWrap);

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
    if (!modal || !previewApi?.container) return;

    const modalContent = modal.querySelector(".modal-content");
    if (!modalContent) return;

    const modalRect = modalContent.getBoundingClientRect();
    const previewEl = previewApi.container;
    const previewRect = previewEl.getBoundingClientRect();

    previewEl.style.position = "absolute";
    previewEl.style.left = `${modalRect.right + 30}px`;
    previewEl.style.top = `${modalRect.top + (modalRect.height / 2) - (previewRect.height / 2)}px`;
  }

  previewApi.hide(); // Prevent showing preview on page load

  return {
    open: async () => {
      formApi.reset();
      await refreshDefinitions();
      openModal();

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

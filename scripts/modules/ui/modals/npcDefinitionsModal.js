// @comment: Comments should not be deleted unless they need updating due to specific commented code changing or the code part is removed. Functions should include sufficient inline comments.
// @file: /scripts/modules/ui/modals/npcDefinitionsModal.js
// @version: 4

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
    modal,
    header,
    bodyWrap,
    layoutSwitcher,
    previewApi,
    open: openModal,
    close
  } = createDefinitionModalShell({
    id: "npc-definitions-modal",
    title: "Manage NPCs",
    withPreview: true,
    previewType: "npc",
    layoutOptions: ["row", "stacked", "gallery"],
    onClose: () => previewApi?.hide()
  });

  const listContainer = createDefListContainer("npc-def-list");
  bodyWrap.appendChild(listContainer);

  const formApi = createNpcFormController({
    onCancel: () => {
      formApi.reset();
      const def = formApi.getCustom?.();
      if (def) previewApi.setFromDefinition(def);
    },
    onDelete: async (idToDelete) => {
      await deleteNpcDefinition(db, idToDelete);
      await refreshDefinitions();
      formApi.reset();
    },
    onSubmit: async (payload) => {
      if (payload.id) {
        await updateNpcDefinition(db, payload.id, payload);
      } else {
        await saveNpcDefinition(db, null, payload);
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
    renderEntry: (def, layout) => renderNpcEntry(def, layout, {
      onClick: (d) => {
        formApi.populate(d);
        previewApi.setFromDefinition(d);
        previewApi.show();
      },
      onDelete: async (id) => {
        await deleteNpcDefinition(db, id);
        await refreshDefinitions();
      }
    })
  });

  async function refreshDefinitions() {
    definitions = await loadNpcDefinitions(db);
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

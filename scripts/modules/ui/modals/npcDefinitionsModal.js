// @comment: Comments should not be deleted unless they need updating due to specific commented code changing or the code part is removed. Functions should include sufficient inline comments.
// @file: /scripts/modules/ui/modals/npcDefinitionsModal.js
// @version: 4.1

import { createModal, closeModal, openModal } from "../uiKit.js";
import { createDefListContainer } from "../../utils/listUtils.js";
import {
  loadNpcDefinitions, saveNpcDefinition, updateNpcDefinition,
  deleteNpcDefinition, subscribeNpcDefinitions
} from "../../services/npcDefinitionsService.js";

import { createLayoutSwitcher } from "../uiKit.js";
import { createPreviewPanel } from "../preview/createPreviewPanel.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createNpcFormController } from "../forms/controllers/npcFormController.js";

export function initNpcDefinitionsModal(db) {
  const { modal, content, header } = createModal({
    id: "npc-definitions-modal",
    title: "Manage NPCs",
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

  const searchWrap = document.createElement("div");
  searchWrap.className = "def-search-wrap";
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search NPCs…";
  searchInput.className = "def-search-input";
  searchWrap.appendChild(searchInput);
  header.appendChild(searchWrap);

  const listContainer = createDefListContainer("npc-def-list");
  const previewApi = createPreviewPanel("npc");

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

  const bodyWrap = document.createElement("div");
  bodyWrap.style.display = "flex";
  bodyWrap.style.flexDirection = "column";
  bodyWrap.style.flex = "1 1 auto";
  bodyWrap.style.minHeight = 0;

  bodyWrap.appendChild(listContainer);
  bodyWrap.appendChild(document.createElement("hr"));

  // ✅ Subheading and buttons above the form
  const formWrap = document.createElement("div");
  formWrap.appendChild(formApi.subheadingWrap);
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
    onDelete: async id => {
      await deleteNpcDefinition(db, id);
      await refreshDefinitions();
    }
  });

  let definitions = [];

  async function refreshDefinitions() {
    definitions = await loadNpcDefinitions(db);
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

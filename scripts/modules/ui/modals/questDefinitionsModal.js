// @comment: Comments should not be deleted unless they need updating due to specific commented code changing or the code part is removed. Functions should include sufficient inline comments.
// @file: /scripts/modules/ui/modals/questDefinitionsModal.js
// @version: 4.1

import { createModal, closeModal, openModal } from "../uiKit.js";
import { createDefListContainer } from "../../utils/listUtils.js";
import {
  loadQuestDefinitions, saveQuestDefinition, updateQuestDefinition,
  deleteQuestDefinition, subscribeQuestDefinitions
} from "../../services/questDefinitionsService.js";

import { createLayoutSwitcher } from "../uiKit.js";
import { createPreviewPanel } from "../preview/createPreviewPanel.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createQuestFormController } from "../forms/controllers/questFormController.js";

export function initQuestDefinitionsModal(db) {
  const { modal, content, header } = createModal({
    id: "quest-definitions-modal",
    title: "Manage Quests",
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
  searchInput.placeholder = "Search quests…";
  searchInput.className = "def-search-input";
  searchWrap.appendChild(searchInput);
  header.appendChild(searchWrap);

  const listContainer = createDefListContainer("quest-def-list");
  const previewApi = createPreviewPanel("quest");

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

  const bodyWrap = document.createElement("div");
  bodyWrap.style.display = "flex";
  bodyWrap.style.flexDirection = "column";
  bodyWrap.style.flex = "1 1 auto";
  bodyWrap.style.minHeight = 0;

  bodyWrap.appendChild(listContainer);
  bodyWrap.appendChild(document.createElement("hr"));

  // ✅ Form section with top-aligned subheading and buttons
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
      await deleteQuestDefinition(db, id);
      await refreshDefinitions();
    }
  });

  let definitions = [];

  async function refreshDefinitions() {
    definitions = await loadQuestDefinitions(db);
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

// @comment: Comments should not be deleted unless they need updating due to specific commented code changing or the code part is removed.
// @file: /scripts/modules/ui/modals/testItemDefinitionsModal.js
// @version: 14

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

  // Layout switcher aligned to top-right
  const layoutSwitcher = createLayoutSwitcher({
    available: ["row", "stacked", "gallery"],
    defaultView: "row",
    onChange: layout => listApi.setLayout(layout)
  });
  header.appendChild(layoutSwitcher);

  // Search input
  const searchWrap = document.createElement("div");
  searchWrap.className = "def-search-wrap";
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search items…";
  searchInput.className = "def-search-input";
  searchWrap.appendChild(searchInput);
  header.appendChild(searchWrap);

  // List container and preview
  const listContainer = createDefListContainer("test-item-def-list");
  const previewApi = createPreviewPanel("item");

  // Form controller (creates subheading + buttons inside form)
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

  // Build modal body
  const bodyWrap = document.createElement("div");
  bodyWrap.style.display = "flex";
  bodyWrap.style.flexDirection = "column";
  bodyWrap.style.flex = "1 1 auto";
  bodyWrap.style.minHeight = 0;

  bodyWrap.appendChild(listContainer);
  bodyWrap.appendChild(document.createElement("hr"));

  // **Only append the form** (it already includes its own header + buttons)
  bodyWrap.appendChild(formApi.form);

  content.appendChild(bodyWrap);

  // List manager
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

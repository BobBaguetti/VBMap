// @file: /scripts/modules/ui/modals/testItemDefinitionsModal.js
// @version: 15

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

  // layout switcher in header
  const layoutSwitcher = createLayoutSwitcher({
    available: ["row", "stacked", "gallery"],
    defaultView: "row",
    onChange: layout => listApi.setLayout(layout)
  });
  header.appendChild(layoutSwitcher);

  // list + preview
  const listContainer = createDefListContainer("test-item-def-list");
  const previewApi = createPreviewPanel("item");

  // form (includes its own Add-Item header + Save/Clear/Delete)
  const formApi = createItemFormController({
    onCancel: () => {
      formApi.reset();
      const def = formApi.getCustom?.();
      if (def) previewApi.setFromDefinition(def);
    },
    onDelete: async (id) => {
      await deleteItemDefinition(db, id);
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

  // build the body
  const bodyWrap = document.createElement("div");
  Object.assign(bodyWrap.style, {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 auto",
    minHeight: "0"
  });

  // append list container (manager will insert its dark search above it)
  bodyWrap.appendChild(listContainer);
  bodyWrap.appendChild(document.createElement("hr"));

  // now append the form itself (with its own header+buttons)
  bodyWrap.appendChild(formApi.form);
  content.appendChild(bodyWrap);

  // wire up list manager
  let definitions = [];
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

  async function refreshDefinitions() {
    definitions = await loadItemDefinitions(db);
    listApi.refresh(definitions);
  }

  // **Move the dark search-bar into the modal header**
  // (list-manager inserted it just above listContainer)
  const listHeaderEl = listContainer.previousElementSibling;
  if (listHeaderEl?.classList.contains("list-header")) {
    listHeaderEl.remove();
    header.appendChild(listHeaderEl);
  }

  // preview positioning (unchanged)
  function positionPreviewPanel() {
    const mc = modal.querySelector(".modal-content");
    if (!mc || !previewApi?.container) return;
    const pr = previewApi.container;
    const r = mc.getBoundingClientRect();
    pr.style.position = "absolute";
    pr.style.left = `${r.right + 30}px`;
    requestAnimationFrame(() => {
      pr.style.top = `${r.top + (r.height/2) - (pr.offsetHeight/2)}px`;
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
      formApi.initPickrs?.();
    },
    refresh: refreshDefinitions
  };
}

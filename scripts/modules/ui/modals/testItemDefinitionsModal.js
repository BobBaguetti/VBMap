// @file: /scripts/modules/ui/modals/testItemDefinitionsModal.js
// @version: 18

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

  // form (includes its own header+buttons)
  const formApi = createItemFormController({
    onCancel: () => {
      formApi.reset();
      previewApi.setFromDefinition({});
      previewApi.show();
    },
    onDelete: async (id) => {
      await deleteItemDefinition(db, id);
      await refreshDefinitions();
      formApi.reset();
      previewApi.setFromDefinition({});
      previewApi.show();
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
      previewApi.setFromDefinition({});
      previewApi.show();
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

  bodyWrap.appendChild(listContainer);
  bodyWrap.appendChild(document.createElement("hr"));
  bodyWrap.appendChild(formApi.form);
  content.appendChild(bodyWrap);

  // list manager wiring
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

  // move dark search-bar into header
  const listHeaderEl = listContainer.previousElementSibling;
  if (listHeaderEl?.classList.contains("list-header")) {
    listHeaderEl.remove();
    header.appendChild(listHeaderEl);
  }

  // preview positioning
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
      formApi.initPickrs();
      // reset preview blank on open
      previewApi.setFromDefinition({});
      requestAnimationFrame(() => {
        positionPreviewPanel();
        previewApi.show();
      });
    },
    refresh: refreshDefinitions
  };
}

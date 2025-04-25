/* @file: /scripts/modules/ui/modals/testItemDefinitionsModal.js */
/* @keep: Comments must NOT be deleted unless their associated code is also deleted. */
/* @version: 25 */

import {
  createModal, closeModal, openModal
} from "../uiKit.js";

import { createDefListContainer } from "../../utils/listUtils.js";
import {
  loadItemDefinitions,
  saveItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
} from "../../services/itemDefinitionsService.js";

import { createLayoutSwitcher }           from "../uiKit.js";
import { createPreviewPanel }             from "../preview/createPreviewPanel.js";
import { createDefinitionListManager }    from "../components/definitionListManager.js";
import { applyColorPresets }              from "../../utils/colorUtils.js";
import { createItemFormController }       from "../forms/controllers/itemFormController.js";
import { destroyAllPickrs }               from "../pickrManager.js";

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

  // Layout switcher in header
  const layoutSwitcher = createLayoutSwitcher({
    available: ["row", "stacked", "gallery"],
    defaultView: "row",
    onChange: layout => listApi.setLayout(layout)
  });
  header.appendChild(layoutSwitcher);

  // List + Preview + Form
  const listContainer = createDefListContainer("test-item-def-list");
  const previewApi    = createPreviewPanel("item");
  const formApi       = createItemFormController({
    onCancel: () => {
      formApi.reset();
      previewApi.setFromDefinition({});
      previewApi.show();
    },
    onDelete: async id => {
      await deleteItemDefinition(db, id);
      await refreshDefinitions();
      formApi.reset();
      previewApi.setFromDefinition({});
      previewApi.show();
    },
    onSubmit: async payload => {
      // map our form’s addToFilters → showInFilters
      payload.showInFilters = payload.addToFilters;

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

  // Build the modal body
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

  // List‐manager wiring
  let definitions = [];
  const listApi = createDefinitionListManager({
    container: listContainer,
    getDefinitions: () => definitions,
    onEntryClick: def => {
      // ensure addToFilters reflects the stored flag
      formApi.populate({ ...def, addToFilters: def.showInFilters });
      formApi.initPickrs();
      previewApi.setFromDefinition({ ...def });
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

  // Move the search‐bar into the header
  const listHeaderEl = listContainer.previousElementSibling;
  if (listHeaderEl?.classList.contains("list-header")) {
    listHeaderEl.remove();
    header.appendChild(listHeaderEl);
  }

  // Position the preview panel
  function positionPreviewPanel() {
    const mc = modal.querySelector(".modal-content");
    if (!mc || !previewApi.container) return;
    const pr = previewApi.container;
    const r  = mc.getBoundingClientRect();
    pr.style.position = "absolute";
    pr.style.left     = `${r.right + 30}px`;
    requestAnimationFrame(() => {
      pr.style.top = `${r.top + (r.height/2) - (pr.offsetHeight/2)}px`;
    });
  }

  previewApi.hide();

  return {
    open: async () => {
      formApi.reset();
      await refreshDefinitions();

      // Tear down any leftover Pickr instances
      destroyAllPickrs();

      // Show modal
      openModal(modal);

      // Initialize Pickr on the fresh form
      formApi.initPickrs();

      // Blank preview
      previewApi.setFromDefinition({});
      requestAnimationFrame(() => {
        positionPreviewPanel();
        previewApi.show();
      });
    },
    refresh: refreshDefinitions
  };
}

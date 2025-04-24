/* @file: /scripts/modules/ui/modals/testItemDefinitionsModal.js */
/* @keep: Comments must NOT be deleted unless their associated code is also deleted; edits to comments only when code changes. */
/* @version: 24 */

import {
  createModal, closeModal, openModal
} from "../uiKit.js";

import { createDefListContainer } from "../../utils/listUtils.js";
import {
  loadItemDefinitions, saveItemDefinition, updateItemDefinition,
  deleteItemDefinition
} from "../../services/itemDefinitionsService.js";

import { createLayoutSwitcher } from "../uiKit.js";
import { createPreviewPanel } from "../preview/createPreviewPanel.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { applyColorPresets } from "../../utils/colorUtils.js";
import { createItemFormController } from "../forms/controllers/itemFormController.js";
import { destroyAllPickrs } from "../../ui/pickrManager.js";

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

  // list + preview + form
  const listContainer = createDefListContainer("test-item-def-list");
  const previewApi    = createPreviewPanel("item");
  const formApi       = createItemFormController({
    onCancel: () => {
      // Reset fields, re-init pickers, and clear preview
      formApi.reset();
      formApi.initPickrs();             // ← ensure the swatches come back
      previewApi.setFromDefinition({});
      previewApi.show();
    },
    onDelete: async id => {
      await deleteItemDefinition(db, id);
      await refreshDefinitions();
      formApi.reset();
      formApi.initPickrs();
      previewApi.setFromDefinition({});
      previewApi.show();
    },
    onSubmit: async payload => {
      applyColorPresets(payload);
      if (payload.id) await updateItemDefinition(db, payload.id, payload);
      else            await saveItemDefinition(db, null, payload);
      await refreshDefinitions();
      formApi.reset();
      formApi.initPickrs();
      previewApi.setFromDefinition({});
      previewApi.show();
    }
  });

  formApi.form.classList.add("ui-scroll-float");

  // Track current definition and live-update preview
  let currentDef = null;
  formApi.form.addEventListener("input",  updatePreview);
  formApi.form.addEventListener("change", updatePreview);

  function updatePreview() {
    const live = formApi.getCustom?.() || {};
    if (currentDef) {
      live.imageSmall = live.imageSmall || currentDef.imageSmall;
      live.imageLarge = live.imageLarge || currentDef.imageLarge;
    }
    previewApi.setFromDefinition(live);
    previewApi.show();
  }

  // build the body
  const bodyWrap = document.createElement("div");
  Object.assign(bodyWrap.style, {
    display:       "flex",
    flexDirection: "column",
    flex:          "1 1 auto",
    minHeight:     "0"
  });
  bodyWrap.appendChild(listContainer);
  bodyWrap.appendChild(document.createElement("hr"));
  bodyWrap.appendChild(formApi.form);
  content.appendChild(bodyWrap);

  // Prime fresh pickers now that the form is in the DOM
  formApi.initPickrs();

  // list manager wiring
  let definitions = [];
  const listApi = createDefinitionListManager({
    container:      listContainer,
    getDefinitions: () => definitions,
    onEntryClick: def => {
      currentDef = def;
      formApi.initPickrs();
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

  // preview positioning helper
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
      formApi.initPickrs();           // ensure Add‐mode swatches show
      await refreshDefinitions();
      destroyAllPickrs();
      openModal(modal);
      formApi.initPickrs();
      previewApi.setFromDefinition({});
      requestAnimationFrame(() => {
        positionPreviewPanel();
        previewApi.show();
      });
    },
    refresh: refreshDefinitions
  };
}

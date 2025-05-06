// @file: /scripts/modules/ui/modals/itemDefinitionsModal.js
// @version: 28.1 – now uses modalHelpers

import {
  createModal,
  openModal,
  closeModal,
  createDropdownField,
  createFormButtonRow
} from "../components/modalHelpers.js";

import { createDefListContainer }      from "../../utils/listUtils.js";
import { createLayoutSwitcher }        from "../components/layoutSwitcher.js";
import { createPreviewPanel }          from "../preview/createPreviewPanel.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createItemFormController }    from "../forms/controllers/itemFormController.js";
import { applyColorPresets }           from "../../utils/colorUtils.js";
import {
  loadItemDefinitions,
  saveItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
} from "../../services/itemDefinitionsService.js";

export function initItemDefinitionsModal(db) {
  let modal, content, header;
  let listApi, formApi, previewApi;
  let definitions = [];

  async function refreshDefinitions() {
    definitions = await loadItemDefinitions(db);
    listApi.refresh(definitions);
  }

  function positionPreviewPanel() {
    const mc = modal.querySelector(".modal-content");
    const pr = previewApi.container;
    if (!mc || !pr) return;
    const r = mc.getBoundingClientRect();
    pr.style.position = "absolute";
    pr.style.left = `${r.right + 30}px`;
    requestAnimationFrame(() => {
      pr.style.top = `${r.top + r.height / 2 - pr.offsetHeight / 2}px`;
    });
  }

  return {
    refresh: refreshDefinitions,

    open: async () => {
      if (!modal) {
        const created = createModal({
          id:          "item-definitions-modal",
          title:       "Manage Items",
          size:        "large",
          backdrop:    true,
          draggable:   false,
          withDivider: true,
          onClose:     () => {
            closeModal(modal);
            previewApi.hide();
          }
        });
        modal   = created.modal;
        content = created.content;
        header  = created.header;
        modal.classList.add("admin-only");

        const layoutSwitcher = createLayoutSwitcher({
          available:   ["row", "stacked", "gallery"],
          defaultView: "row",
          onChange:    layout => listApi.setLayout(layout)
        });
        header.appendChild(layoutSwitcher);

        const listContainer = createDefListContainer("item-def-list");
        previewApi = createPreviewPanel("item");
        formApi    = createItemFormController({
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
        formApi.form.addEventListener("input", e => {
          if (e.target.id === "fld-add-to-filters") return;
          const live = formApi.getCurrent();
          if (live) {
            previewApi.setFromDefinition(live);
            previewApi.show();
          }
        });

        const bodyWrap = document.createElement("div");
        Object.assign(bodyWrap.style, {
          display:       "flex",
          flexDirection: "column",
          flex:          "1 1 auto",
          minHeight:     "0"
        });
        bodyWrap.append(listContainer, document.createElement("hr"), formApi.form);
        content.appendChild(bodyWrap);

        listApi = createDefinitionListManager({
          container:      listContainer,
          getDefinitions: () => definitions,
          renderEntry:    renderItemEntry,
          onEntryClick:   def => {
            formApi.populate({ ...def, addToFilters: def.showInFilters });
            formApi.initPickrs();
            previewApi.setFromDefinition(def);
            previewApi.show();
          },
          onDelete: async id => {
            await deleteItemDefinition(db, id);
            await refreshDefinitions();
          }
        });

        const maybeHeader = listContainer.previousElementSibling;
        if (maybeHeader?.classList.contains("list-header")) {
          maybeHeader.remove();
          header.appendChild(maybeHeader);
        }

        previewApi.hide();
      }

      formApi.reset();
      await refreshDefinitions();
      destroyAllPickrs();

      openModal(modal);
      formApi.initPickrs();
      previewApi.setFromDefinition({});
      requestAnimationFrame(() => {
        positionPreviewPanel();
        previewApi.show();
      });
    }
  };
}

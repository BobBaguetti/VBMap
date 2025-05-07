// @file: /scripts/modules/ui/modals/itemDefinitionsModal.js
// @version: 28 – modal creation deferred until open() 

import {
  createModal,
  closeModal,
  openModal
} from "../uiKit.js";

import { createDefListContainer } from "../../utils/listUtils.js";
import {
  loadItemDefinitions,
  saveItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
} from "../../services/itemDefinitionsService.js";

import { createLayoutSwitcher }        from "../uiKit.js";
import { createPreviewPanel }          from "../preview/createPreviewPanel.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { applyColorPresets }           from "../../utils/colorUtils.js";
import { createItemFormController }    from "../forms/controllers/itemFormController.js";
import { destroyAllPickrs }            from "../pickrManager.js";

export function initItemDefinitionsModal(db) {
  // These will be assigned on first open()
  let modal, content, header;
  let listApi, formApi, previewApi;
  let definitions = [];

  // Reusable function to refresh the list data
  async function refreshDefinitions() {
    definitions = await loadItemDefinitions(db);
    listApi.refresh(definitions);
  }

  // Calculates and repositions the preview panel
  function positionPreviewPanel() {
    const mc = modal.querySelector(".modal-content");
    const pr = previewApi.container;
    if (!mc || !pr) return;
    const r = mc.getBoundingClientRect();
    pr.style.position = "absolute";
    pr.style.left = `${r.right + 30}px`;
    // center vertically
    requestAnimationFrame(() => {
      pr.style.top = `${r.top + r.height / 2 - pr.offsetHeight / 2}px`;
    });
  }

  return {
    refresh: refreshDefinitions,

    open: async () => {
      // 1) On first open, build the modal DOM and wire everything
      if (!modal) {
        const created = createModal({
          id:        "item-definitions-modal",
          title:     "Manage Items",
          size:      "large",
          backdrop:  true,
          draggable: false,
          withDivider: true,
          onClose: () => {
            closeModal(modal);
            previewApi.hide();
          }
        });
        modal   = created.modal;
        content = created.content;
        header  = created.header;

        // Only visible to admins
        modal.classList.add("admin-only");

        // Layout switcher button
        const layoutSwitcher = createLayoutSwitcher({
          available:   ["row", "stacked", "gallery"],
          defaultView: "row",
          onChange:    layout => listApi.setLayout(layout)
        });
        header.appendChild(layoutSwitcher);

        // Create list container, preview panel, and form controller
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

        // Allow form to scroll
        formApi.form.classList.add("ui-scroll-float");
        formApi.form.addEventListener("input", e => {
          if (e.target.id === "fld-add-to-filters") return;
          const live = formApi.getCustom?.();
          if (live) {
            previewApi.setFromDefinition(live);
            previewApi.show();
          }
        });

        // Assemble the modal body
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

        // Wire up the definition list manager
        listApi = createDefinitionListManager({
          container:      listContainer,
          getDefinitions: () => definitions,
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

        // Move search‐bar header into modal header if present
        const maybeHeader = listContainer.previousElementSibling;
        if (maybeHeader?.classList.contains("list-header")) {
          maybeHeader.remove();
          header.appendChild(maybeHeader);
        }

        // Hide preview initially
        previewApi.hide();
      }

      // 2) Every time we open: reset form, rebuild data, tear down pickrs
      formApi.reset();
      await refreshDefinitions();
      destroyAllPickrs();

      // 3) Show it
      openModal(modal);

      // 4) Re-init pickrs & preview
      formApi.initPickrs();
      previewApi.setFromDefinition({});
      requestAnimationFrame(() => {
        positionPreviewPanel();
        previewApi.show();
      });
    }
  };
}

// @file: src/modules/ui/modals/itemDefinitionsModal.js
// @version: 1.0 — now uses definitionModalShell + shared color‐picker wiring

import { createDefinitionModalShell, initModalColorPickers } from "../definitionModalShell.js";
import { createDefListContainer }      from "../../utils/listUtils.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createPreviewPanel }          from "../preview/createPreviewPanel.js";

import {
  loadItemDefinitions,
  saveItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
} from "../../services/itemDefinitionsService.js";

import { createItemFormController } from "../forms/controllers/itemFormController.js";

export function initItemDefinitionsModal(db) {
  let listApi, formApi, previewApi, definitions = [];
  let modalEl, headerEl, contentEl;

  async function refreshList() {
    definitions = await loadItemDefinitions(db);
    listApi.refresh(definitions);
  }

  return {
    async open() {
      if (!modalEl) {
        // 1) build shell
        ({ modalEl, headerEl, contentEl } = createDefinitionModalShell({
          id:         "item-definitions-modal",
          title:      "Manage Items",
          toolbar:    [
            { iconClass: "fas fa-list",    onClick: () => listApi.setLayout("row")    },
            { iconClass: "fas fa-th-large", onClick: () => listApi.setLayout("gallery")},
            { iconClass: "fas fa-th-list",  onClick: () => listApi.setLayout("stacked")} 
          ],
          searchable: true,
          size:       "large"
        }));
        modalEl.classList.add("admin-only");

        // 2) list + preview + form
        const listContainer = createDefListContainer("item-def-list");
        previewApi  = createPreviewPanel("item");
        formApi     = createItemFormController({
          onCancel: async () => {
            formApi.reset();
            previewApi.setFromDefinition({});
            previewApi.show();
          },
          onDelete: async id => {
            await deleteItemDefinition(db, id);
            await refreshList();
            formApi.reset();
            previewApi.setFromDefinition({});
            previewApi.show();
          },
          onSubmit: async payload => {
            payload.showInFilters = payload.addToFilters;
            if (payload.id) {
              await updateItemDefinition(db, payload.id, payload);
            } else {
              await saveItemDefinition(db, null, payload);
            }
            await refreshList();
            formApi.reset();
            previewApi.setFromDefinition({});
            previewApi.show();
          }
        }, db);

        // 3) assemble
        headerEl.append(...listContainer.querySelectorAll(".list-header"));
        contentEl.append(
          listContainer,
          document.createElement("hr"),
          formApi.form
        );

        // 4) wiring list manager
        listApi = createDefinitionListManager({
          container:      listContainer,
          getDefinitions: () => definitions,
          onEntryClick: def => {
            formApi.populate(def);
            formApi.initPickrs();
            previewApi.setFromDefinition(def);
            previewApi.show();
          },
          onDelete: async id => {
            await deleteItemDefinition(db, id);
            await refreshList();
          }
        });

        // 5) initial state
        previewApi.hide();
      }

      // every open…
      formApi.reset();
      await refreshList();
      openModal(modalEl);             // from definitionModalShell
      initModalColorPickers(contentEl);
      formApi.initPickrs();
      requestAnimationFrame(() => {
        previewApi.setFromDefinition({});
        previewApi.show();
      });
    }
  };
}

// @file: src/modules/ui/modals/itemDefinitionsModal.js
// @version: 1.1 — corrected import path for definitionModalShell

import { createDefinitionModalShell, initModalColorPickers } from "../components/definitionModalShell.js";
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
  let modal, header, content;

  async function refreshList() {
    definitions = await loadItemDefinitions(db);
    listApi.refresh(definitions);
  }

  return {
    async open() {
      if (!modal) {
        // 1) build shell
        ({ modal, header, content } = createDefinitionModalShell({
          id:         "item-definitions-modal",
          title:      "Manage Items",
          size:       "large",
          withPreview: true,
          previewType: "item",
          layoutOptions: ["row","gallery","stacked"],
          searchable: true,
          onClose: () => previewApi?.hide()
        }));
        modal.classList.add("admin-only");

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
        header.append(...listContainer.querySelectorAll(".list-header"));
        content.append(
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
      modal.open();
      initModalColorPickers(content);
      formApi.initPickrs();
      requestAnimationFrame(() => {
        previewApi.setFromDefinition({});
        previewApi.show();
      });
    }
  };
}

// @file: src/modules/ui/modals/itemDefinitionsModal.js
// @version: 1.3 — shell without preview, shell search disabled, own preview only

import { createDefinitionModalShell } from "../components/definitionModalShell.js";
import { initModalPickrs }            from "../pickrManager.js";
import { createDefListContainer }     from "../../utils/listUtils.js";
import { createDefinitionListManager }from "../components/definitionListManager.js";
import { createPreviewPanel }         from "../preview/createPreviewPanel.js";

import {
  loadItemDefinitions,
  saveItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
} from "../../services/itemDefinitionsService.js";

import { createItemFormController } from "../forms/controllers/itemFormController.js";

export function initItemDefinitionsModal(db) {
  let listApi, formApi, previewApi, definitions = [];
  let modal, header, content, openShell;

  async function refreshList() {
    definitions = await loadItemDefinitions(db);
    listApi.refresh(definitions);
  }

  return {
    async open() {
      if (!modal) {
        // build the shell (no built-in preview, disable shell search)
        ({ modal, header, content, open: openShell } = createDefinitionModalShell({
          id:            "item-definitions-modal",
          title:         "Manage Items",
          size:          "large",
          searchable:    false,
          layoutOptions: ["row", "gallery", "stacked"],
          onClose:       () => previewApi?.hide()
        }));
        modal.classList.add("admin-only");

        // create your own preview panel
        previewApi = createPreviewPanel("item");

        // build list & form
        const listContainer = createDefListContainer("item-def-list");
        formApi = createItemFormController({
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

        // assemble
        header.append(...listContainer.querySelectorAll(".list-header"));
        content.append(
          listContainer,
          document.createElement("hr"),
          formApi.form
        );

        // list manager
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

        previewApi.hide();
      }

      // each open
      formApi.reset();
      await refreshList();

      openShell();               // show modal
      formApi.initPickrs();      // wire per-form pickrManager
      initModalPickrs(content);  // init any color-swatch buttons inside

      previewApi.setFromDefinition({});
      previewApi.show();
    }
  };
}

// @file: /scripts/modules/ui/modals/itemDefinitionsModal.js
// @version: 2.0 – rebuilt on definitionModalShell

import {
  loadItemDefinitions,
  saveItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
} from "../../services/itemDefinitionsService.js";

import { createDefinitionModalShell }      from "../components/definitionModalShell.js";
import { createDefinitionListManager }     from "../components/definitionListManager.js";
import { createItemFormController }        from "../forms/controllers/itemFormController.js";
import { createPreviewPanel }              from "../preview/createPreviewPanel.js";

export function initItemDefinitionsModal(db) {
  let listApi, formApi, previewApi;
  let definitions = [];

  async function refreshDefinitions() {
    definitions = await loadItemDefinitions(db);
    listApi.refresh(definitions);
  }

  // Build the shell once
  const shell = createDefinitionModalShell({
    id:             "item-definitions-modal",
    title:          "Manage Items",
    size:           "large",
    withPreview:    true,
    previewType:    "item",
    layoutOptions:  ["row","stacked","gallery"],
    onClose:        () => previewApi.hide()
  });

  return {
    open: async () => {
      // First-time setup
      if (!listApi) {
        // 1) list on left
        const listContainer = document.createElement("div");
        shell.bodyWrap.appendChild(listContainer);
        listApi = createDefinitionListManager({
          container:      listContainer,
          getDefinitions: () => definitions,
          onEntryClick: def => {
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

        // 2) form on right
        formApi = createItemFormController({
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
            // sync filter flag
            payload.showInFilters = payload.addToFilters;
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
        shell.bodyWrap.appendChild(formApi.form);

        // 3) preview panel
        previewApi = shell.previewApi;

        // live preview
        formApi.form.addEventListener("input", () => {
          const live = formApi.getCurrent();
          previewApi.setFromDefinition(live);
          previewApi.show();
        });
      }

      // Every open: reset + load
      formApi.reset();
      await refreshDefinitions();
      shell.open();
      formApi.initPickrs();
      previewApi.setFromDefinition({});
      previewApi.show();
    }
  };
}

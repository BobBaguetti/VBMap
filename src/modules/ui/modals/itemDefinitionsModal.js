// @file: src/modules/ui/modals/itemDefinitionsModal.js
// @version: 1.5 — plug in getCurrentPayload to previewController

import { createDefinitionModalShell } from "../components/definitionModalShell.js";
import { initModalPickrs }            from "../pickrManager.js";
import { createDefListContainer }     from "../../utils/listUtils.js";
import { createDefinitionListManager }from "../components/definitionListManager.js";
import { createPreviewController }    from "../preview/previewController.js";

import {
  loadItemDefinitions,
  saveItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
} from "../../services/itemDefinitionsService.js";

import { createItemFormController } from "../forms/controllers/itemFormController.js";

export function initItemDefinitionsModal(db) {
  let listApi, formApi, definitions = [];
  let modal, header, content, openShell;
  let showPreview, liveReShow, hidePreview;

  async function refreshList() {
    definitions = await loadItemDefinitions(db);
    listApi.refresh(definitions);
  }

  return {
    async open() {
      if (!modal) {
        ({ modal, header, content, open: openShell } = createDefinitionModalShell({
          id:            "item-definitions-modal",
          title:         "Manage Items",
          size:          "large",
          searchable:    false,
          layoutOptions: ["row","gallery","stacked"],
          onClose:       () => hidePreview()
        }));
        modal.classList.add("admin-only");

        // wire preview with formApi.getCurrentPayload
        const preview = createPreviewController("item", () => formApi.getCurrentPayload());
        showPreview  = preview.show;
        liveReShow   = preview.liveReShow;
        hidePreview  = preview.hide;

        // list & form
        const listContainer = createDefListContainer("item-def-list");
        formApi = createItemFormController({
          onCancel: async () => {
            formApi.reset();
            liveReShow();
          },
          onDelete: async id => {
            await deleteItemDefinition(db, id);
            await refreshList();
            formApi.reset();
            liveReShow();
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
            liveReShow();
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
            liveReShow();
          },
          onDelete: async id => {
            await deleteItemDefinition(db, id);
            await refreshList();
          }
        });
      }

      // each open
      formApi.reset();
      await refreshList();

      openShell();
      formApi.initPickrs();
      initModalPickrs(content);

      // show blank or initial payload
      liveReShow();
    }
  };
}

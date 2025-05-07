// @file: src/modules/ui/modals/itemDefinitionsModal.js
// @version: 1.10 — removed formApi.initPickrs() calls

import { createDefinitionModalShell }  from "../components/definitionModalShell.js";
import { initModalPickrs }             from "../pickrManager.js";
import { createDefListContainer }      from "../../utils/listUtils.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createPreviewController }     from "../preview/previewController.js";

import {
  loadItemDefinitions,
  saveItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
} from "../../services/itemDefinitionsService.js";

import { createItemFormController }    from "../forms/controllers/itemFormController.js";

export function initItemDefinitionsModal(db) {
  let listApi, formApi, definitions = [];
  let modal, header, content, openShell;
  let showPreview, hidePreview;

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
          searchable:    true,
          layoutOptions: ["row","gallery","stacked"],
          onClose:       () => hidePreview()
        }));
        modal.classList.add("admin-only");

        // preview
        const preview = createPreviewController("item");
        showPreview = preview.show;
        hidePreview = preview.hide;

        // list & form
        const listContainer = createDefListContainer("item-def-list");
        formApi = createItemFormController({
          onCancel:   async () => {
            formApi.reset();
            showPreview({});
          },
          onDelete: async id => {
            await deleteItemDefinition(db, id);
            await refreshList();
            formApi.reset();
            showPreview({});
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
            showPreview({});
          },
          onFieldChange: data => showPreview(data)
        }, db);

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
            showPreview(def);
          },
          onDelete: async id => {
            await deleteItemDefinition(db, id);
            await refreshList();
          }
        });

        // hook shell search to list filter
        const shellSearch = modal.querySelector(".modal__search");
        if (shellSearch) {
          shellSearch.addEventListener("input", () => {
            listApi.filter(shellSearch.value);
          });
        }
      }

      // on each open
      formApi.reset();
      await refreshList();

      openShell();
      initModalPickrs(content);
      showPreview({});
    }
  };
}

// @file: /scripts/modules/ui/modals/chestDefinitionsModal.js
// @version: 1.3 – now with search & layout switcher reposition

import {
  createModal,
  openModal,
  closeModal,
  createLayoutSwitcher
} from "../uiKit.js";

import { createDefListContainer } from "../../utils/listUtils.js";
import {
  loadChestTypes,
  saveChestType,
  updateChestType,
  deleteChestType
} from "../../services/chestTypesService.js";

import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createPreviewPanel }          from "../preview/createPreviewPanel.js";
import { createChestFormController }   from "../forms/controllers/chestFormController.js";

export function initChestDefinitionsModal(db) {
  let modal, content, header;
  let listApi, formApi, previewApi;
  let definitions = [];

  async function refreshDefinitions() {
    definitions = await loadChestTypes(db);
    listApi.refresh(definitions);
  }

  return {
    open: async () => {
      if (!modal) {
        // 1) Build the base modal
        const created = createModal({
          id:           "chest-definitions-modal",
          title:        "Manage Chest Types",
          size:         "large",
          backdrop:     true,
          withDivider:  true,
          onClose:      () => {
            closeModal(modal);
            previewApi.hide();
          }
        });
        modal   = created.modal;
        content = created.content;
        header  = created.header;
        modal.classList.add("admin-only");

        // 2) Add layout‐switcher buttons to header
        const layoutSwitcher = createLayoutSwitcher({
          available:   ["row","stacked","gallery"],
          defaultView: "row",
          onChange:    view => listApi.setLayout(view)
        });
        header.appendChild(layoutSwitcher);

        // 3) Create list container
        const listContainer = createDefListContainer("chest-def-list");

        // 4) Create preview and form controller (pass db)
        previewApi = createPreviewPanel("chest");
        formApi    = createChestFormController({
          onCancel:  async () => {
            formApi.reset();
            previewApi.setFromDefinition({});
            previewApi.show();
          },
          onDelete:  async id => {
            await deleteChestType(db, id);
            await refreshDefinitions();
            formApi.reset();
            previewApi.setFromDefinition({});
            previewApi.show();
          },
          onSubmit:  async payload => {
            if (payload.id) await updateChestType(db, payload.id, payload);
            else             await saveChestType(db, null, payload);
            await refreshDefinitions();
            formApi.reset();
            previewApi.setFromDefinition({});
            previewApi.show();
          }
        }, db);

        // 5) Wire up live-preview on form input
        formApi.form.classList.add("ui-scroll-float");
        formApi.form.addEventListener("input", () => {
          const live = formApi.getCustom();
          if (live) {
            previewApi.setFromDefinition(live);
            previewApi.show();
          }
        });

        // 6) Assemble the body
        const bodyWrap = document.createElement("div");
        Object.assign(bodyWrap.style, {
          display:       "flex",
          flexDirection: "column",
          flex:          "1 1 auto",
          minHeight:     "0"
        });
        const hr = document.createElement("hr");
        bodyWrap.append(listContainer, hr, formApi.form);
        content.appendChild(bodyWrap);

        // 7) Hook up the list manager
        listApi = createDefinitionListManager({
          container:      listContainer,
          getDefinitions: () => definitions,
          onEntryClick:   def => {
            formApi.populate(def);
            previewApi.setFromDefinition(def);
            previewApi.show();
          },
          onDelete:       id => deleteChestType(db, id).then(refreshDefinitions)
        });

        // 8) Move the auto-generated list search into the modal header
        const maybeSearch = listContainer.previousElementSibling;
        if (maybeSearch?.classList.contains("list-header")) {
          maybeSearch.remove();
          header.appendChild(maybeSearch);
        }

        previewApi.hide();
      }

      // every open: reset + reload
      formApi.reset();
      await refreshDefinitions();
      openModal(modal);
      previewApi.setFromDefinition({});
      previewApi.show();
    }
  };
}

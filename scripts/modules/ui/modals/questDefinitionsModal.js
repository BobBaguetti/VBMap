// @file: /scripts/modules/ui/modals/questDefinitionsModal.js
// @version: 1.0 – stub for Quest Definitions using modalHelpers

import {
  createModal,
  openModal,
  closeModal,
  createDropdownField,
  createFormButtonRow
} from "../components/modalHelpers.js";

import { createLayoutSwitcher }        from "../components/layoutSwitcher.js";
import { createDefListContainer }      from "../../utils/listUtils.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createPreviewPanel }          from "../preview/createPreviewPanel.js";

// TODO: replace with your real Quest service functions
import {
  loadQuestDefinitions,
  saveQuestDefinition,
  updateQuestDefinition,
  deleteQuestDefinition
} from "../../services/questDefinitionsService.js";

// TODO: implement your Quest form controller
import { createQuestFormController } from "../forms/controllers/questFormController.js";

export function initQuestDefinitionsModal(db) {
  let modal, content, header;
  let listApi, formApi, previewApi;
  let definitions = [];

  async function refreshDefinitions() {
    definitions = await loadQuestDefinitions(db);
    listApi?.refresh(definitions);
  }

  return {
    refresh: refreshDefinitions,

    open: async () => {
      if (!modal) {
        const built = createModal({
          id:          "quest-definitions-modal",
          title:       "Manage Quests",
          size:        "large",
          backdrop:    true,
          draggable:   false,
          withDivider: true,
          onClose:     () => {
            closeModal(modal);
            previewApi.hide();
          }
        });
        modal   = built.modal;
        content = built.content;
        header  = built.header;
        modal.classList.add("admin-only");

        // layout toggle
        const layoutSwitcher = createLayoutSwitcher({
          available:   ["row", "stacked", "gallery"],
          defaultView: "row",
          onChange:    v => listApi.setLayout(v)
        });
        header.appendChild(layoutSwitcher);

        // list + preview + form
        const listContainer = createDefListContainer("quest-def-list");
        previewApi = createPreviewPanel("quest");
        formApi    = createQuestFormController({
          onCancel: () => { formApi.reset(); previewApi.hide(); },
          onDelete: async id => {
            await deleteQuestDefinition(db, id);
            await refreshDefinitions();
            formApi.reset();
            previewApi.hide();
          },
          onSubmit: async payload => {
            if (payload.id) {
              await updateQuestDefinition(db, payload.id, payload);
            } else {
              await saveQuestDefinition(db, null, payload);
            }
            await refreshDefinitions();
            formApi.reset();
            previewApi.hide();
          }
        }, db);

        formApi.form.classList.add("ui-scroll-float");
        formApi.form.addEventListener("input", () => {
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
          onEntryClick:   def => {
            formApi.populate(def);
            previewApi.setFromDefinition(def);
            previewApi.show();
          },
          onDelete: async id => {
            await deleteQuestDefinition(db, id);
            await refreshDefinitions();
          }
        });

        const searchHeader = listContainer.previousElementSibling;
        if (searchHeader?.classList.contains("list-header")) {
          searchHeader.remove();
          header.appendChild(searchHeader);
        }

        previewApi.hide();
      }

      formApi.reset();
      await refreshDefinitions();

      openModal(modal);
      requestAnimationFrame(() => previewApi.show());
    }
  };
}

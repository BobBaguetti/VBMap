// @file: /scripts/modules/ui/modals/npcDefinitionsModal.js
// @version: 1.0 – stub for NPC Definitions using modalHelpers

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

// TODO: replace these with your real NPC service functions
import {
  loadNpcDefinitions,
  saveNpcDefinition,
  updateNpcDefinition,
  deleteNpcDefinition
} from "../../services/npcDefinitionsService.js";

// TODO: implement your NPC form controller (builder + controller)
import { createNpcFormController } from "../forms/controllers/npcFormController.js";

export function initNpcDefinitionsModal(db) {
  let modal, content, header;
  let listApi, formApi, previewApi;
  let definitions = [];

  async function refreshDefinitions() {
    definitions = await loadNpcDefinitions(db);
    listApi?.refresh(definitions);
  }

  return {
    refresh: refreshDefinitions,

    open: async () => {
      if (!modal) {
        const built = createModal({
          id:          "npc-definitions-modal",
          title:       "Manage NPC Types",
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

        // list container, preview, form
        const listContainer = createDefListContainer("npc-def-list");
        previewApi = createPreviewPanel("npc");
        formApi    = createNpcFormController({
          onCancel: () => { formApi.reset(); previewApi.hide(); },
          onDelete: async id => {
            await deleteNpcDefinition(db, id);
            await refreshDefinitions();
            formApi.reset();
            previewApi.hide();
          },
          onSubmit: async payload => {
            if (payload.id) {
              await updateNpcDefinition(db, payload.id, payload);
            } else {
              await saveNpcDefinition(db, null, payload);
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
            await deleteNpcDefinition(db, id);
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

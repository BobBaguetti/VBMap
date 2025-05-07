// @file: /scripts/modules/ui/modals/questDefinitionsModal.js
// @version: 8 — modal creation deferred until open() 

import { createDefinitionModalShell } from "../components/definitionModalShell.js";
import { createDefListContainer }     from "../../utils/listUtils.js";
import {
  loadQuestDefinitions,
  saveQuestDefinition,
  updateQuestDefinition,
  deleteQuestDefinition
}                                      from "../../services/questDefinitionsService.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createQuestFormController }   from "../forms/controllers/questFormController.js";
import { renderQuestEntry }            from "../entries/questEntryRenderer.js";
import { initModalPickrs }             from "../pickrManager.js";

export function initQuestDefinitionsModal(db) {
  // These will be set up on first open()
  let modal, header, bodyWrap, previewApi, openModal;
  let formApi, listApi;
  let definitions = [];

  // Helper to reload and refresh the list
  async function refresh() {
    definitions = await loadQuestDefinitions(db);
    listApi.refresh(definitions);
  }

  // The open() method
  async function open() {
    // On first call, build the modal shell and all wiring
    if (!modal) {
      const shell = createDefinitionModalShell({
        id:           "quest-definitions-modal",
        title:        "Manage Quests",
        withPreview:  true,
        previewType:  "quest",
        layoutOptions:["row", "stacked", "gallery"],
        onClose:      () => previewApi.hide()
      });

      // Destructure out the shell pieces
      modal      = shell.modal;
      header     = shell.header;
      bodyWrap   = shell.bodyWrap;
      previewApi = shell.previewApi;
      openModal  = shell.open;

      // Hide for non-admins
      modal.classList.add("admin-only");

      // 1) Create & append the definitions list container
      const listContainer = createDefListContainer("quest-def-list");
      bodyWrap.appendChild(listContainer);

      // 2) Set up the form controller
      formApi = createQuestFormController({
        onCancel: () => formApi.reset(),
        onDelete: async id => {
          await deleteQuestDefinition(db, id);
          formApi.reset();
          await refresh();
        },
        onSubmit: async payload => {
          if (payload.id) {
            await updateQuestDefinition(db, payload.id, payload);
          } else {
            await saveQuestDefinition(db, null, payload);
          }
          formApi.reset();
          await refresh();
        }
      });
      formApi.form.classList.add("ui-scroll-float");

      // Insert a divider & then the form
      bodyWrap.appendChild(document.createElement("hr"));
      bodyWrap.appendChild(formApi.form);

      // 3) Wire up the list manager
      listApi = createDefinitionListManager({
        container:      listContainer,
        getDefinitions: () => definitions,
        renderEntry:    (def, layout) => renderQuestEntry(def, layout, {
          onClick:  d => {
            formApi.populate(d);
            previewApi.setFromDefinition(d);
            previewApi.show();
          },
          onDelete: id => deleteQuestDefinition(db, id).then(refresh)
        })
      });

      // Move the “dark” search-bar header into the modal header
      const hdr = listContainer.previousElementSibling;
      if (hdr?.classList.contains("list-header")) {
        hdr.remove();
        header.appendChild(hdr);
      }

      // Hide preview initially
      previewApi.hide();
    }

    // On every open: reset form & data, then show
    formApi.reset();
    await refresh();
    openModal();

    // Initialize color‐pickers in this modal
    initModalPickrs(bodyWrap);

    // Finally, show the preview pane
    previewApi.show();
  }

  return { open, refresh };
}

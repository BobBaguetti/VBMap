// @file: /scripts/modules/ui/modals/npcDefinitionsModal.js
// @version: 8 — modal creation deferred until open()

import { createDefinitionModalShell } from "../components/definitionModalShell.js";
import { createDefListContainer }     from "../../utils/listUtils.js";
import {
  loadNpcDefinitions,
  saveNpcDefinition,
  updateNpcDefinition,
  deleteNpcDefinition
}                                     from "../../services/npcDefinitionsService.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createNpcFormController }     from "../forms/controllers/npcFormController.js";
import { renderNpcEntry }              from "../entries/npcEntryRenderer.js";
import { initModalPickrs }             from "../pickrManager.js";

export function initNpcDefinitionsModal(db) {
  // These will be set on first open()
  let modal, header, bodyWrap, previewApi, openModal;
  let formApi, listApi;
  let definitions = [];

  // Reload the definitions and refresh list
  async function refresh() {
    definitions = await loadNpcDefinitions(db);
    listApi.refresh(definitions);
  }

  async function open() {
    // Build shell & wiring once
    if (!modal) {
      const shell = createDefinitionModalShell({
        id:           "npc-definitions-modal",
        title:        "Manage NPCs",
        withPreview:  true,
        previewType:  "npc",
        layoutOptions:["row", "stacked", "gallery"],
        onClose:      () => previewApi.hide()
      });
      modal      = shell.modal;
      header     = shell.header;
      bodyWrap   = shell.bodyWrap;
      previewApi = shell.previewApi;
      openModal  = shell.open;

      // Only for admins
      modal.classList.add("admin-only");

      // 1) List container
      const listContainer = createDefListContainer("npc-def-list");
      bodyWrap.appendChild(listContainer);

      // 2) Form controller
      formApi = createNpcFormController({
        onCancel: () => formApi.reset(),
        onDelete: async (id) => {
          await deleteNpcDefinition(db, id);
          formApi.reset();
          await refresh();
        },
        onSubmit: async (payload) => {
          if (payload.id) {
            await updateNpcDefinition(db, payload.id, payload);
          } else {
            await saveNpcDefinition(db, null, payload);
          }
          formApi.reset();
          await refresh();
        }
      });
      formApi.form.classList.add("ui-scroll-float");

      // Divider + form
      bodyWrap.appendChild(document.createElement("hr"));
      bodyWrap.appendChild(formApi.form);

      // 3) Definition list manager
      listApi = createDefinitionListManager({
        container:      listContainer,
        getDefinitions: () => definitions,
        renderEntry:    (def, layout) => renderNpcEntry(def, layout, {
          onClick: (d) => {
            formApi.populate(d);
            previewApi.setFromDefinition(d);
            previewApi.show();
          },
          onDelete: (id) => deleteNpcDefinition(db, id).then(refresh)
        })
      });

      // Move the search-bar header
      const hdr = listContainer.previousElementSibling;
      if (hdr?.classList.contains("list-header")) {
        hdr.remove();
        header.appendChild(hdr);
      }

      // Hide preview initially
      previewApi.hide();
    }

    // On every open: reset, reload, then show
    formApi.reset();
    await refresh();
    openModal();

    // Initialize pickrs and then show preview
    initModalPickrs(bodyWrap);
    previewApi.show();
  }

  return { open, refresh };
}

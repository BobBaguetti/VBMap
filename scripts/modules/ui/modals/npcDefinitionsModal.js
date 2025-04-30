// @file: /scripts/modules/ui/modals/npcDefinitionsModal.js
// @version: 1.1 — use addNpcDefinition API and align controller onSubmit

import { createDefinitionModalShell }   from "../components/definitionModalShell.js";
import { createDefListContainer }       from "../../utils/listUtils.js";
import {
  loadNpcDefinitions,
  subscribeNpcDefinitions,
  addNpcDefinition,
  updateNpcDefinition,
  deleteNpcDefinition
}                                       from "../../services/npcDefinitionsService.js";
import { createDefinitionListManager }  from "../components/definitionListManager.js";
import { createNpcFormController }      from "../forms/controllers/npcFormController.js";
import { renderNpcEntry }               from "../entries/npcEntryRenderer.js";
import { initModalPickrs }              from "../pickrManager.js";

export function initNpcDefinitionsModal(db) {
  let modal, header, bodyWrap, previewApi, openModal;
  let formApi, listApi;

  // Rebuild or refresh list on subscription
  function setupSubscription() {
    // unsubscribe if needed (left out for brevity)
    subscribeNpcDefinitions(db, defs => listApi.refresh(defs));
  }

  async function open() {
    if (!modal) {
      // 1) Shell
      const shell = createDefinitionModalShell({
        id:          "npc-definitions-modal",
        title:       "Manage NPCs",
        withPreview: true,
        previewType: "npc",
        layoutOptions: ["row", "stacked", "gallery"]
      });
      modal      = shell.modal;
      header     = shell.header;
      bodyWrap   = shell.bodyWrap;
      previewApi = shell.previewApi;
      openModal  = shell.open;

      modal.classList.add("admin-only");

      // 2) List container + manager
      const listContainer = createDefListContainer("npc-def-list");
      bodyWrap.appendChild(listContainer);
      listApi = createDefinitionListManager({
        container:      listContainer,
        getDefinitions: () => [],  // will be replaced by subscription
        renderEntry:    (def, layout) => renderNpcEntry(def, layout, {
          onClick:  d => {
            formApi.populate(d);
            previewApi.setFromDefinition(d);
            previewApi.show();
          },
          onDelete: id => deleteNpcDefinition(db, id)
        })
      });

      // 3) Form controller
      formApi = createNpcFormController({
        onCancel: () => formApi.reset(),
        onDelete: async id => {
          await deleteNpcDefinition(db, id);
          formApi.reset();
        },
        onSubmit: async def => {
          if (def.id) {
            await updateNpcDefinition(db, def);
          } else {
            await addNpcDefinition(db, def);
          }
          formApi.reset();
        }
      });
      formApi.form.classList.add("ui-scroll-float");
      bodyWrap.appendChild(document.createElement("hr"));
      bodyWrap.appendChild(formApi.form);

      // Move search header
      const hdr = listContainer.previousElementSibling;
      if (hdr?.classList.contains("list-header")) {
        hdr.remove();
        header.appendChild(hdr);
      }

      initModalPickrs(bodyWrap);
      previewApi.hide();

      // Live updates
      setupSubscription();
    }

    formApi.reset();
    openModal();
    previewApi.show();
  }

  return { open };
}

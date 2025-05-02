// @file: /scripts/modules/ui/modals/npcDefinitionsModal.js
// @version: 2.1 – use default toolbar actions instead of overriding

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
  let formApi, listApi, unsubscribe;

  async function refreshList() {
    const defs = await loadNpcDefinitions(db);
    listApi.refresh(defs);
  }

  function startSubscription() {
    unsubscribe?.();
    unsubscribe = subscribeNpcDefinitions(db, defs => {
      listApi.refresh(defs);
    });
  }

  async function open() {
    if (!modal) {
      // 1) Build shell (default toolbar: list/form actions, preview & search handled automatically)
      const shell = createDefinitionModalShell({
        id:           "npc-definitions-modal",
        title:        "Manage NPCs",
        withPreview:  true,
        previewType:  "npc",
        layoutOptions:["row", "stacked", "gallery"]
      });
      modal      = shell.modal;
      header     = shell.header;
      bodyWrap   = shell.bodyWrap;
      previewApi = shell.previewApi;
      openModal  = shell.open;

      modal.classList.add("admin-only");

      // 2) Definition list
      const listContainer = createDefListContainer("npc-def-list");
      bodyWrap.appendChild(listContainer);
      listApi = createDefinitionListManager({
        container:      listContainer,
        getDefinitions: () => [],  // replaced by subscription
        renderEntry:    (def, layout) => renderNpcEntry(def, layout, {
          onClick:  d => {
            formApi.populate(d);
            previewApi.setFromDefinition(d);
            previewApi.show();
          },
          onDelete: async id => {
            if (confirm(`Delete NPC "${id}"?`)) {
              await deleteNpcDefinition(db, id);
              formApi.reset();
              previewApi.hide();
            }
          }
        })
      });

      // 3) Form controller
      formApi = createNpcFormController(db, {
        onCancel: async () => {
          formApi.reset();
          previewApi.hide();
        },
        onDelete: async id => {
          if (confirm(`Delete NPC "${id}"?`)) {
            await deleteNpcDefinition(db, id);
            formApi.reset();
            previewApi.hide();
          }
        },
        onSubmit: async def => {
          if (def.id) {
            await updateNpcDefinition(db, def.id, def);
          } else {
            await addNpcDefinition(db, def);
          }
          formApi.reset();
          previewApi.hide();
        }
      });
      formApi.form.classList.add("ui-scroll-float");
      bodyWrap.appendChild(document.createElement("hr"));
      bodyWrap.appendChild(formApi.form);

      // 4) Move search bar into header (if present)
      const maybeHeader = listContainer.previousElementSibling;
      if (maybeHeader?.classList.contains("list-header")) {
        maybeHeader.remove();
        header.appendChild(maybeHeader);
      }

      // 5) Initialize color pickers and hide preview
      initModalPickrs(bodyWrap);
      previewApi.hide();

      // 6) Start Firestore subscription and initial load
      startSubscription();
      await refreshList();
    }

    // Always reset form and hide preview on open
    formApi.reset();
    previewApi.hide();
    openModal();
  }

  return { open };
}

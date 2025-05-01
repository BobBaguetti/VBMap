// @file: /scripts/modules/ui/modals/npcDefinitionsModal.js
// @version: 1.3 — pass `db` into the form controller

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
      // 1) Build shell
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
        getDefinitions: () => [], // will be replaced by subscription
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

      // 3) Form controller — **pass `db` as the first argument** 
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

      // 4) Pull the search bar into the header
      const maybeHeader = listContainer.previousElementSibling;
      if (maybeHeader?.classList.contains("list-header")) {
        maybeHeader.remove();
        header.appendChild(maybeHeader);
      }

      initModalPickrs(bodyWrap);
      previewApi.hide();

      startSubscription();
      await refreshList();
    }

    formApi.reset();
    previewApi.hide();
    openModal();
  }

  return { open };
}

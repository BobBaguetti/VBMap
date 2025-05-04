// @file: /scripts/modules/ui/modals/npcDefinitionsModal.js
// @version: 3.6 – modular CRUD modal wired like Item/Chest

import {
  createModal,
  closeModal,
  openModal
} from "../uiKit.js";

import { createLayoutSwitcher }        from "../uiKit.js";
import { createDefListContainer }      from "../../utils/listUtils.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createPreviewPanel }          from "../preview/createPreviewPanel.js";
import { renderNpcEntry }              from "../entries/npcEntryRenderer.js";

import {
  loadNpcDefinitions,
  addNpcDefinition,
  updateNpcDefinition,
  deleteNpcDefinition,
  subscribeNpcDefinitions
} from "../../services/npcDefinitionsService.js";

import { createNpcFormController }     from "../forms/controllers/npcFormController.js";

export function initNpcDefinitionsModal(db) {
  let modal, content, header;
  let listApi, formApi, previewApi, unsubscribe;
  let definitions = [];

  async function refreshDefinitions() {
    definitions = await loadNpcDefinitions(db);
    listApi.refresh(definitions);
  }

  function positionPreviewPanel() {
    const mc = modal.querySelector(".modal-content");
    const pr = previewApi.container;
    if (!mc || !pr) return;
    const r = mc.getBoundingClientRect();
    pr.style.position = "absolute";
    pr.style.left   = `${r.right + 30}px`;
    requestAnimationFrame(() => {
      pr.style.top = `${r.top + r.height/2 - pr.offsetHeight/2}px`;
    });
  }

  return {
    refresh: refreshDefinitions,

    open: async () => {
      if (!modal) {
        // Build modal shell
        const built = createModal({
          id:          "npc-definitions-modal",
          title:       "Manage NPCs",
          size:        "large",
          backdrop:    true,
          draggable:   false,
          withDivider: true,
          onClose:     () => {
            closeModal(modal);
            previewApi.hide();
            unsubscribe?.();
          }
        });
        modal   = built.modal;
        content = built.content;
        header  = built.header;
        modal.classList.add("admin-only");

        // Layout switcher
        const layoutSwitcher = createLayoutSwitcher({
          available:   ["row","stacked","gallery"],
          defaultView: "row",
          onChange:    v => listApi.setLayout(v)
        });
        header.appendChild(layoutSwitcher);

        // List, Preview, Form
        const listContainer = createDefListContainer("npc-def-list");
        previewApi = createPreviewPanel("npc");
        formApi    = createNpcFormController(db, {
          onCancel: () => {
            formApi.reset();
            previewApi.hide();
          },
          onDelete: async id => {
            await deleteNpcDefinition(db, id);
            await refreshDefinitions();
            formApi.reset();
            previewApi.hide();
          },
          onSubmit: async def => {
            if (def.id) await updateNpcDefinition(db, def.id, def);
            else       await addNpcDefinition(db, def);
            await refreshDefinitions();
            formApi.reset();
            previewApi.hide();
          }
        });

        // Wire form input to live preview
        formApi.form.classList.add("ui-scroll-float");
        formApi.form.addEventListener("input", () => {
          const cur = formApi.getCurrent();
          if (cur) {
            previewApi.setFromDefinition(cur);
            previewApi.show();
          }
        });

        // Assemble body
        const bodyWrap = document.createElement("div");
        Object.assign(bodyWrap.style, {
          display:       "flex",
          flexDirection: "column",
          flex:          "1 1 auto",
          minHeight:     "0"
        });
        bodyWrap.appendChild(listContainer);
        bodyWrap.appendChild(document.createElement("hr"));
        bodyWrap.appendChild(formApi.form);
        content.appendChild(bodyWrap);

        // Definition list manager
        listApi = createDefinitionListManager({
          container:      listContainer,
          getDefinitions: () => definitions,
          renderEntry:    renderNpcEntry,
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

        // Move search bar into header
        const searchHdr = listContainer.previousElementSibling;
        if (searchHdr?.classList.contains("list-header")) {
          searchHdr.remove();
          header.appendChild(searchHdr);
        }

        // Final setup
        unsubscribe = subscribeNpcDefinitions(db, snap => {
          definitions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          listApi.refresh(definitions);
        });
        previewApi.hide();
      }

      // On every open
      formApi.reset();
      await refreshDefinitions();
      openModal(modal);
      positionPreviewPanel();
      previewApi.show();
    }
  };
}

// @file: /scripts/modules/ui/modals/npcDefinitionsModal.js
// @version: 1.0 – modular NPC Definitions modal (2025‑05‑05)

import {
  createModal,
  closeModal,
  openModal
} from "../uiKit.js";

import { createLayoutSwitcher }         from "../uiKit.js";
import { createDefListContainer }       from "../../utils/listUtils.js";
import { createDefinitionListManager }  from "../components/definitionListManager.js";

import {
  loadNpcDefinitions,
  saveNpcDefinition,
  updateNpcDefinition,
  deleteNpcDefinition
} from "../../services/npcDefinitionsService.js";

import { loadItemDefinitions }      from "../../services/itemDefinitionsService.js";
import { createNpcFormController }  from "../forms/controllers/npcFormController.js";
import { createNpcPreviewPanel }    from "../preview/npcPreview.js";

/**
 * Full‑screen modal to manage NPC types (create, edit, delete).
 * Mirrors the Chest modal pattern but plugs in the new NPC form/controller.
 */
export function initNpcDefinitionsModal(db) {
  let modal, content, header;
  let listApi, formApi, previewApi;
  let definitions = [];
  let itemMap = Object.create(null);

  async function ensureItemMap() {
    if (!Object.keys(itemMap).length) {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }
  }

  async function refreshDefinitions() {
    definitions = await loadNpcDefinitions(db);
    listApi?.refresh(definitions);
  }

  function positionPreviewPanel() {
    const mc = modal.querySelector(".modal-content");
    const pr = previewApi.container;
    if (!mc || !pr) return;
    const r = mc.getBoundingClientRect();
    pr.style.position = "absolute";
    pr.style.left = `${r.right + 30}px`;
    requestAnimationFrame(() => {
      pr.style.top = `${r.top + r.height / 2 - pr.offsetHeight / 2}px`;
    });
  }

  return {
    refresh: refreshDefinitions,
    open: async () => {
      /* ── first open: build DOM ─────────────────────────── */
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

        const layoutSwitcher = createLayoutSwitcher({
          available:   ["row", "stacked", "gallery"],
          defaultView: "row",
          onChange:    v => listApi.setLayout(v)
        });
        header.appendChild(layoutSwitcher);

        const listContainer = createDefListContainer("npc-def-list");
        previewApi = createNpcPreviewPanel(document.createElement("div"));
        formApi    = createNpcFormController({
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
            if (def.id) {
              await updateNpcDefinition(db, def.id, def);
            } else {
              await saveNpcDefinition(db, null, def);
            }
            await refreshDefinitions();
            formApi.reset();
            previewApi.hide();
          }
        }, db);

        /* live preview on form input */
        formApi.form.classList.add("ui-scroll-float");
        formApi.form.addEventListener("input", async () => {
          const live = formApi.getCurrent?.();
          if (!live) return;
          await ensureItemMap();
          previewApi.setFromDefinition(live);
          previewApi.show();
        });

        /* body assembly */
        const bodyWrap = document.createElement("div");
        Object.assign(bodyWrap.style, {
          display: "flex",
          flexDirection: "column",
          flex: "1 1 auto",
          minHeight: "0"
        });
        bodyWrap.append(listContainer, document.createElement("hr"), formApi.form);
        content.appendChild(bodyWrap);

        /* list manager */
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

        /* move search bar (if any) into header */
        const maybeSearch = listContainer.previousElementSibling;
        if (maybeSearch?.classList.contains("list-header")) {
          maybeSearch.remove();
          header.appendChild(maybeSearch);
        }

        /* overlay preview panel */
        document.body.appendChild(previewApi.container);
        previewApi.hide();
      }

      /* ── every open ────────────────────────────────────── */
      formApi.reset();
      await ensureItemMap();
      await refreshDefinitions();

      openModal(modal);
      requestAnimationFrame(positionPreviewPanel);
    }
  };
}

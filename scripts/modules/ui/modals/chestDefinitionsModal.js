// @file:    /scripts/modules/ui/modals/chestDefinitionsModal.js
// @version: 3.0 – rebuilt to mirror itemDefinitionsModal

import {
  createModal,
  closeModal,
  openModal
} from "../uiKit.js";

import { createLayoutSwitcher }        from "../uiKit.js";
import { createDefListContainer }      from "../../utils/listUtils.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createPreviewPanel }          from "../preview/createPreviewPanel.js";

import {
  loadChestDefinitions,
  saveChestDefinition,
  updateChestDefinition,
  deleteChestDefinition
} from "../../services/chestDefinitionsService.js";

import { loadItemDefinitions }       from "../../services/itemDefinitionsService.js";
import { createChestFormController } from "../forms/controllers/chestFormController.js";

export function initChestDefinitionsModal(db) {
  // first-open build vars
  let modal, content, header;
  let listApi, formApi, previewApi;
  let definitions = [];
  let itemMap = Object.create(null); // id → itemDef

  // helper to build or refresh item map
  async function ensureItemMap() {
    if (!Object.keys(itemMap).length) {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }
  }

  async function refreshDefinitions() {
    definitions = await loadChestDefinitions(db);
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
      // ─────────────── First open: build the DOM once ────────────────
      if (!modal) {
        const built = createModal({
          id:          "chest-definitions-modal",
          title:       "Manage Chest Types",
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

        // layout switcher, identical to item modal
        const layoutSwitcher = createLayoutSwitcher({
          available:   ["row", "stacked", "gallery"],
          defaultView: "row",
          onChange:    v => listApi.setLayout(v)
        });
        header.appendChild(layoutSwitcher);

        // main pieces
        const listContainer = createDefListContainer("chest-def-list");
        previewApi = createPreviewPanel("chest");
        formApi    = createChestFormController({
          onCancel: () => {
            formApi.reset();
            previewApi.setFromDefinition({ lootPool: [] });
            previewApi.show();
          },
          onDelete: async id => {
            await deleteChestDefinition(db, id);
            await refreshDefinitions();
            formApi.reset();
            previewApi.setFromDefinition({ lootPool: [] });
            previewApi.show();
          },
          onSubmit: async payload => {
            if (payload.id) {
              await updateChestDefinition(db, payload.id, payload);
            } else {
              await saveChestDefinition(db, null, payload);
            }
            await refreshDefinitions();
            formApi.reset();
            previewApi.setFromDefinition({ lootPool: [] });
            previewApi.show();
          }
        }, db);

        // live preview on form input
        formApi.form.classList.add("ui-scroll-float");
        formApi.form.addEventListener("input", async () => {
          const live = formApi.getCustom?.();
          if (!live) return;
          await ensureItemMap();
          previewApi.setFromDefinition({
            ...live,
            lootPool: (live.lootPool || [])
              .map(id => itemMap[id])
              .filter(Boolean)
          });
          previewApi.show();
        });

        // body assembly
        const bodyWrap = document.createElement("div");
        Object.assign(bodyWrap.style, {
          display:       "flex",
          flexDirection: "column",
          flex:          "1 1 auto",
          minHeight:     "0"
        });
        bodyWrap.append(listContainer, document.createElement("hr"), formApi.form);
        content.appendChild(bodyWrap);

        // list manager
        listApi = createDefinitionListManager({
          container:      listContainer,
          getDefinitions: () => definitions,
          onEntryClick:   async def => {
            await ensureItemMap();
            formApi.populate(def);
            previewApi.setFromDefinition({
              ...def,
              lootPool: (def.lootPool || [])
                .map(id => itemMap[id])
                .filter(Boolean)
            });
            previewApi.show();
          },
          onDelete: async id => {
            await deleteChestDefinition(db, id);
            await refreshDefinitions();
          }
        });

        // move search bar (if listUtils added one) into header
        const maybeSearch = listContainer.previousElementSibling;
        if (maybeSearch?.classList.contains("list-header")) {
          maybeSearch.remove();
          header.appendChild(maybeSearch);
        }

        previewApi.hide();
      }

      // ─────────────── Every open: reset + reload data ───────────────
      formApi.reset();
      await ensureItemMap();
      await refreshDefinitions();

      openModal(modal);

      formApi.initPickrs();
      previewApi.setFromDefinition({ lootPool: [] });
      requestAnimationFrame(() => {
        positionPreviewPanel();
        previewApi.show();
      });
    }
  };
}

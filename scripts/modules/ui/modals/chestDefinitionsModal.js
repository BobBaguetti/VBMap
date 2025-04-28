// @file: /scripts/modules/ui/modals/chestDefinitionsModal.js
// @version: 2.1 – switched to chestDefinitionsService, renamed functions

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
import { loadItemDefinitions }         from "../../services/itemDefinitionsService.js";
import { createChestFormController }   from "../forms/controllers/chestFormController.js";

export function initChestDefinitionsModal(db) {
  let modal, content, header;
  let listApi, formApi, previewApi;
  let definitions = [];
  let itemMap = {};

  async function ensureItemMap() {
    if (!Object.keys(itemMap).length) {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }
  }

  async function refreshDefinitions() {
    definitions = await loadChestDefinitions(db);
    listApi.refresh(definitions);
  }

  // subheader element for “Add/Edit” label + buttons
  let bodySubheader;

  function positionPreviewPanel() {
    const mc = modal.querySelector(".modal-content");
    const pr = previewApi.container;
    if (!mc || !pr) return;
    const rect = mc.getBoundingClientRect();
    pr.style.position = "absolute";
    pr.style.left     = `${rect.right + 30}px`;
    pr.style.zIndex   = "1051"; // above backdrop but below modal
    requestAnimationFrame(() => {
      pr.style.top = `${rect.top + rect.height/2 - pr.offsetHeight/2}px`;
    });
  }

  function setModeAdd() {
    bodySubheader.querySelector(".subheader-label").textContent = "Add Chest Type";
    formApi.reset();
    previewApi.setFromDefinition({ lootPool: [] });
    previewApi.show();
    positionPreviewPanel();
  }

  function setModeEdit(def) {
    bodySubheader.querySelector(".subheader-label").textContent = "Edit Chest Type";
    formApi.populate(def);
    previewApi.setFromDefinition({
      ...def,
      lootPool: (def.lootPool || []).map(id => itemMap[id]).filter(Boolean)
    });
    previewApi.show();
    positionPreviewPanel();
  }

  return {
    open: async () => {
      if (!modal) {
        // 1) create modal
        const created = createModal({
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
        modal   = created.modal;
        content = created.content;
        header  = created.header;
        modal.classList.add("admin-only");

        // 2) layout switcher
        const layoutSwitcher = createLayoutSwitcher({
          available:   ["row","stacked","gallery"],
          defaultView: "row",
          onChange:    v => listApi.setLayout(v)
        });
        header.appendChild(layoutSwitcher);

        // 3) list container
        const listContainer = createDefListContainer("chest-def-list");

        // 4) preview + form
        previewApi = createPreviewPanel("chest");
        formApi    = createChestFormController({
          onCancel: async () => setModeAdd(),
          onDelete: async id => {
            await deleteChestDefinition(db, id);
            await refreshDefinitions();
            setModeAdd();
          },
          onSubmit: async payload => {
            if (payload.id) {
              await updateChestDefinition(db, payload.id, payload);
            } else {
              await saveChestDefinition(db, null, payload);
            }
            await refreshDefinitions();
            setModeAdd();
          }
        }, db);

        // 5) live‐preview wiring
        formApi.form.classList.add("ui-scroll-float");
        formApi.form.addEventListener("input", async () => {
          const live = formApi.getCustom?.();
          if (!live) return;
          await ensureItemMap();
          previewApi.setFromDefinition({
            ...live,
            lootPool: (live.lootPool || []).map(id => itemMap[id]).filter(Boolean)
          });
          previewApi.show();
          positionPreviewPanel();
        });

        // 6) build in‐form subheader
        bodySubheader = document.createElement("div");
        bodySubheader.className = "modal-subheader";
        Object.assign(bodySubheader.style, {
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          margin:         "8px 0"
        });
        const lbl = document.createElement("span");
        lbl.className = "subheader-label";
        bodySubheader.appendChild(lbl);

        // 7) assemble body: list + divider + form
        const divider = document.createElement("hr");
        // move buttons row into form and prepend our subheader
        const btnRow = formApi.form.querySelector(".floating-buttons");
        formApi.form.prepend(bodySubheader);

        const bodyWrap = document.createElement("div");
        Object.assign(bodyWrap.style, {
          display:       "flex",
          flexDirection: "column",
          flex:          "1 1 auto",
          minHeight:     "0"
        });
        bodyWrap.append(listContainer, divider, formApi.form);
        content.appendChild(bodyWrap);

        // 8) definition list manager
        listApi = createDefinitionListManager({
          container:      listContainer,
          getDefinitions: () => definitions,
          onEntryClick:   async def => {
            await ensureItemMap();
            setModeEdit(def);
          },
          onDelete: id => deleteChestDefinition(db, id).then(refreshDefinitions)
        });

        // 9) move search into header
        const maybeSearch = listContainer.previousElementSibling;
        if (maybeSearch?.classList.contains("list-header")) {
          maybeSearch.remove();
          header.appendChild(maybeSearch);
        }

        previewApi.hide();
      }

      // 10) every open
      await ensureItemMap();
      await refreshDefinitions();
      setModeAdd();
      openModal(modal);

      formApi.initPickrs?.();
      requestAnimationFrame(positionPreviewPanel);
    }
  };
}
 
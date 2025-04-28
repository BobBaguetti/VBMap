// @file: /scripts/modules/ui/modals/chestDefinitionsModal.js
// @version: 1.8 – defer build until open; add subheader, preview positioning, add/edit mode buttons

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
  loadChestTypes,
  saveChestType,
  updateChestType,
  deleteChestType
} from "../../services/chestTypesService.js";
import { loadItemDefinitions }         from "../../services/itemDefinitionsService.js";
import { createChestFormController }   from "../forms/controllers/chestFormController.js";

export function initChestDefinitionsModal(db) {
  let modal, content, header;
  let subheader;
  let listApi, formApi, previewApi;
  let definitions = [];

  // Cache all item defs for preview
  let itemMap = {};
  async function ensureItemMap() {
    if (!Object.keys(itemMap).length) {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }
  }

  // Refresh list items
  async function refreshDefinitions() {
    definitions = await loadChestTypes(db);
    listApi.refresh(definitions);
  }

  // Position the preview panel alongside the modal
  function positionPreviewPanel() {
    const mc = modal.querySelector(".modal-content");
    const pr = previewApi.container;
    if (!mc || !pr) return;
    const rect = mc.getBoundingClientRect();
    pr.style.position = "absolute";
    pr.style.left     = `${rect.right + 30}px`;
    // center vertically
    requestAnimationFrame(() => {
      pr.style.top = `${rect.top + rect.height/2 - pr.offsetHeight/2}px`;
    });
  }

  // Switch to "Add Chest Type" mode
  function setModeAdd() {
    subheader.textContent = "Add Chest Type";
    formApi.reset();
    previewApi.setFromDefinition({ lootPool: [] });
    previewApi.show();
  }

  // Switch to "Edit Chest Type" mode
  function setModeEdit(def) {
    subheader.textContent = "Edit Chest Type";
    formApi.populate(def);
    previewApi.setFromDefinition({
      ...def,
      lootPool: (def.lootPool || []).map(id => itemMap[id]).filter(Boolean)
    });
    previewApi.show();
  }

  return {
    open: async () => {
      // 1) Build modal on first open
      if (!modal) {
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

        // Subheader placeholder
        subheader = document.createElement("div");
        subheader.className = "modal-subheader";
        subheader.style.margin = "8px 0";
        header.appendChild(subheader);

        // Layout switcher
        const layoutSwitcher = createLayoutSwitcher({
          available:   ["row","stacked","gallery"],
          defaultView: "row",
          onChange:    view => listApi.setLayout(view)
        });
        header.appendChild(layoutSwitcher);

        // Definition list container
        const listContainer = createDefListContainer("chest-def-list");

        // Preview panel & form controller
        previewApi = createPreviewPanel("chest");
        formApi    = createChestFormController({
          onCancel:   () => { setModeAdd(); },
          onDelete:   async id => {
            await deleteChestType(db, id);
            await refreshDefinitions();
            setModeAdd();
          },
          onSubmit:   async payload => {
            if (payload.id) {
              await updateChestType(db, payload.id, payload);
            } else {
              await saveChestType(db, null, payload);
            }
            await refreshDefinitions();
            setModeAdd();
          }
        }, db);

        // Live‐preview wiring
        formApi.form.classList.add("ui-scroll-float");
        formApi.form.addEventListener("input", async () => {
          const custom = formApi.getCustom?.();
          if (!custom) return;
          await ensureItemMap();
          previewApi.setFromDefinition({
            ...custom,
            lootPool: (custom.lootPool || [])
              .map(id => itemMap[id])
              .filter(Boolean)
          });
          previewApi.show();
          positionPreviewPanel();
        });

        // Assemble body: list + divider + form
        const bodyWrap = document.createElement("div");
        Object.assign(bodyWrap.style, {
          display:       "flex",
          flexDirection: "column",
          flex:          "1 1 auto",
          minHeight:     "0"
        });
        bodyWrap.append(listContainer, document.createElement("hr"), formApi.form);
        content.appendChild(bodyWrap);

        // Definition list manager
        listApi = createDefinitionListManager({
          container:      listContainer,
          getDefinitions: () => definitions,
          onEntryClick:   async def => {
            await ensureItemMap();
            setModeEdit(def);
          },
          onDelete: id => deleteChestType(db, id).then(refreshDefinitions)
        });

        // Move search into header
        const maybeSearch = listContainer.previousElementSibling;
        if (maybeSearch?.classList.contains("list-header")) {
          maybeSearch.remove();
          header.appendChild(maybeSearch);
        }

        previewApi.hide();
      }

      // 2) On every open: reset, reload data, then show
      await ensureItemMap();
      await refreshDefinitions();
      setModeAdd();
      openModal(modal);

      // 3) Position preview after layout
      formApi.initPickrs?.();
      requestAnimationFrame(positionPreviewPanel);
    }
  };
}

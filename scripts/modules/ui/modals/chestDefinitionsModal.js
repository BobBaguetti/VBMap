// @file: /scripts/modules/ui/modals/chestDefinitionsModal.js
// @version: 2.0 – embed buttons inside form so Save/Cancel/Delete work

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
    definitions = await loadChestTypes(db);
    listApi.refresh(definitions);
  }

  // Will hold our “Add/Edit Chest Type” header + buttons
  let bodySubheader;

  // Position the preview beside the modal
  function positionPreviewPanel() {
    const mc = modal.querySelector(".modal-content");
    const pr = previewApi.container;
    if (!mc || !pr) return;
    const rect = mc.getBoundingClientRect();
    pr.style.position = "absolute";
    pr.style.left     = `${rect.right + 30}px`;
    pr.style.zIndex   = "1051";   // above backdrop (1040) but below modal (1050+)
    requestAnimationFrame(() => {
      pr.style.top = `${rect.top + rect.height/2 - pr.offsetHeight/2}px`;
    });
  }

  // Switch into “Add” mode
  function setModeAdd() {
    bodySubheader.querySelector(".subheader-label").textContent = "Add Chest Type";
    formApi.reset();
    previewApi.setFromDefinition({ lootPool: [] });
    previewApi.show();
    positionPreviewPanel();
  }

  // Switch into “Edit” mode
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
        // 1) Build the modal shell
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

        // 2) Layout switcher in header
        const layoutSwitcher = createLayoutSwitcher({
          available:   ["row","stacked","gallery"],
          defaultView: "row",
          onChange:    view => listApi.setLayout(view)
        });
        header.appendChild(layoutSwitcher);

        // 3) Prepare list container
        const listContainer = createDefListContainer("chest-def-list");

        // 4) Preview panel & form
        previewApi = createPreviewPanel("chest");
        formApi    = createChestFormController({
          onCancel: async () => setModeAdd(),
          onDelete: async id => {
            await deleteChestType(db, id);
            await refreshDefinitions();
            setModeAdd();
          },
          onSubmit: async payload => {
            if (payload.id) {
              await updateChestType(db, payload.id, payload);
            } else {
              await saveChestType(db, null, payload);
            }
            await refreshDefinitions();
            setModeAdd();
          }
        }, db);

        // 5) Live preview wiring
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
          positionPreviewPanel();
        });

        // 6) Build our in-form subheader (label + button row)
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

        // 7) Assemble body:
        //   — listContainer
        //   — divider
        //   — <form> (with subheader & buttons prepended inside it)
        const divider = document.createElement("hr");

        // Move the floating-buttons row _into_ the form, then prepend our subheader
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

        // 8) Definition list manager
        listApi = createDefinitionListManager({
          container:      listContainer,
          getDefinitions: () => definitions,
          onEntryClick:   async def => {
            await ensureItemMap();
            setModeEdit(def);
          },
          onDelete: id => deleteChestType(db, id).then(refreshDefinitions)
        });

        // 9) Move search bar into header
        const maybeSearch = listContainer.previousElementSibling;
        if (maybeSearch?.classList.contains("list-header")) {
          maybeSearch.remove();
          header.appendChild(maybeSearch);
        }

        previewApi.hide();
      }

      // 10) Every open: reload & show Add mode
      await ensureItemMap();
      await refreshDefinitions();
      setModeAdd();
      openModal(modal);

      // Kick off preview positioning
      formApi.initPickrs?.();
      requestAnimationFrame(positionPreviewPanel);
    }
  };
}

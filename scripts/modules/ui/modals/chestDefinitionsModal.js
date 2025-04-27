// @file: /scripts/modules/ui/modals/chestDefinitionsModal.js
// @version: 1.6 – fully aligned with Manage Items modal

import {
  createModal,
  openModal,
  closeModal,
  createLayoutSwitcher
} from "../uiKit.js";

import { createDefListContainer }    from "../../utils/listUtils.js";
import {
  loadChestTypes,
  saveChestType,
  updateChestType,
  deleteChestType
} from "../../services/chestTypesService.js";

import { loadItemDefinitions }         from "../../services/itemDefinitionsService.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createPreviewPanel }          from "../preview/createPreviewPanel.js";
import { createChestFormController }   from "../forms/controllers/chestFormController.js";

export function initChestDefinitionsModal(db) {
  let modal, content, header;
  let listApi, formApi, previewApi;
  let definitions = [];
  let itemMap = {};

  // Build a map of itemId → full item definition (for lootPool preview)
  async function ensureItemMap() {
    if (Object.keys(itemMap).length === 0) {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }
  }

  async function refreshDefinitions() {
    definitions = await loadChestTypes(db);
    listApi.refresh(definitions);
  }

  // Positions the preview pane to the right of the modal
  function positionPreviewPanel() {
    const mc = modal.querySelector(".modal-content");
    const pr = previewApi.container;
    if (!mc || !pr) return;
    const r = mc.getBoundingClientRect();
    pr.style.position = "absolute";
    pr.style.left     = `${r.right + 30}px`;
    requestAnimationFrame(() => {
      pr.style.top = `${r.top + r.height / 2 - pr.offsetHeight / 2}px`;
    });
  }

  return {
    open: async () => {
      if (!modal) {
        // 1) Create modal shell
        const created = createModal({
          id:          "chest-definitions-modal",
          title:       "Manage Chest Types",
          size:        "large",
          backdrop:    true,
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

        // 2) Layout‐switcher
        const layoutSwitcher = createLayoutSwitcher({
          available:   ["row","stacked","gallery"],
          defaultView: "row",
          onChange:    view => listApi.setLayout(view)
        });
        header.appendChild(layoutSwitcher);

        // 3) Definition list
        const listContainer = createDefListContainer("chest-def-list");

        // 4) Preview panel + form
        previewApi = createPreviewPanel("chest");
        formApi    = createChestFormController({
          onCancel: async () => {
            formApi.reset();
            previewApi.setFromDefinition({ lootPool: [] });
            previewApi.show();
          },
          onDelete: async id => {
            await deleteChestType(db, id);
            await refreshDefinitions();
            formApi.reset();
            previewApi.setFromDefinition({ lootPool: [] });
            previewApi.show();
          },
          onSubmit: async payload => {
            if (payload.id) {
              await updateChestType(db, payload.id, payload);
            } else {
              await saveChestType(db, null, payload);
            }
            await refreshDefinitions();
            formApi.reset();
            previewApi.setFromDefinition({ lootPool: [] });
            previewApi.show();
          }
        }, db);

        // 5) Live preview on form input
        formApi.form.classList.add("ui-scroll-float");
        formApi.form.addEventListener("input", async () => {
          const live = formApi.getCustom();
          await ensureItemMap();
          previewApi.setFromDefinition({
            ...live,
            lootPool: (live.lootPool || [])
              .map(id => itemMap[id])
              .filter(Boolean)
          });
        });

        // 6) Assemble body
        const bodyWrap = document.createElement("div");
        Object.assign(bodyWrap.style, {
          display:       "flex",
          flexDirection: "column",
          flex:          "1 1 auto",
          minHeight:     "0"
        });
        bodyWrap.append(listContainer, document.createElement("hr"), formApi.form);
        content.appendChild(bodyWrap);

        // 7) DefinitionListManager wiring
        listApi = createDefinitionListManager({
          container:      listContainer,
          getDefinitions: () => definitions,
          onEntryClick: async def => {
            formApi.populate(def);
            await ensureItemMap();
            previewApi.setFromDefinition({
              ...def,
              lootPool: (def.lootPool || [])
                .map(id => itemMap[id])
                .filter(Boolean)
            });
            previewApi.show();
          },
          onDelete: id => deleteChestType(db, id).then(refreshDefinitions)
        });

        // 8) Move list‐search into header
        const maybeSearch = listContainer.previousElementSibling;
        if (maybeSearch?.classList.contains("list-header")) {
          maybeSearch.remove();
          header.appendChild(maybeSearch);
        }

        previewApi.hide();
      }

      // onOpen: reset, reload, show
      formApi.reset();
      await ensureItemMap();
      await refreshDefinitions();
      openModal(modal);
      previewApi.setFromDefinition({ lootPool: [] });
      requestAnimationFrame(() => {
        positionPreviewPanel();
        previewApi.show();
      });
    }
  };
}

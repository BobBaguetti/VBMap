// @file: /scripts/modules/ui/modals/chestDefinitionsModal.js
// @version: 1.6 – loot-pool picker integrated & full item lookup

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
  let itemMap     = {};

  // Load & cache all item definitions once
  async function ensureItemMap() {
    if (Object.keys(itemMap).length === 0) {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }
  }

  // Reload chest-type list
  async function refreshDefinitions() {
    definitions = await loadChestTypes(db);
    listApi.refresh(definitions);
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

        // 2) Layout switcher
        const layoutSwitcher = createLayoutSwitcher({
          available:   ["row", "stacked", "gallery"],
          defaultView: "row",
          onChange:    view => listApi.setLayout(view)
        });
        header.appendChild(layoutSwitcher);

        // 3) Definition list container
        const listContainer = createDefListContainer("chest-def-list");

        // 4) Preview panel & form controller
        previewApi = createPreviewPanel("chest");
        formApi = createChestFormController({
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

        // 5) Live preview as form changes
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

        // 7) Definition list manager
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

        // 8) Move auto-generated search into header
        const maybeSearch = listContainer.previousElementSibling;
        if (maybeSearch?.classList.contains("list-header")) {
          maybeSearch.remove();
          header.appendChild(maybeSearch);
        }

        previewApi.hide();
      }

      // Each open: reset, preload items, refresh, show
      formApi.reset();
      await ensureItemMap();
      await refreshDefinitions();
      openModal(modal);
      previewApi.setFromDefinition({ lootPool: [] });
      previewApi.show();
    }
  };
}

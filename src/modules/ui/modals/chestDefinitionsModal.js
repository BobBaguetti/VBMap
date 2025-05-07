// @file: src/modules/ui/modals/chestDefinitionsModal.js
// @version: 1.1 — corrected import path for definitionModalShell

import { createDefinitionModalShell, initModalColorPickers } from "../components/definitionModalShell.js";
import { createDefListContainer }      from "../../utils/listUtils.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createPreviewPanel }          from "../preview/createPreviewPanel.js";

import {
  loadChestDefinitions,
  saveChestDefinition,
  updateChestDefinition,
  deleteChestDefinition
} from "../../services/chestDefinitionsService.js";

import { createChestFormController }   from "../forms/controllers/chestFormController.js";

export function initChestDefinitionsModal(db) {
  let listApi, formApi, previewApi, definitions = [];
  let modal, header, content;
  let itemMap = {};

  async function ensureItemMap() {
    if (!Object.keys(itemMap).length) {
      const items = await import("../../services/itemDefinitionsService.js")
                         .then(m => m.loadItemDefinitions(db));
      itemMap = Object.fromEntries(items.map(i => [i.id,i]));
    }
  }

  async function refreshList() {
    definitions = await loadChestDefinitions(db);
    listApi.refresh(definitions);
  }

  return {
    async open() {
      if (!modal) {
        // 1) build shell
        ({ modal, header, content } = createDefinitionModalShell({
          id:         "chest-definitions-modal",
          title:      "Manage Chest Types",
          size:        "large",
          withPreview: true,
          previewType: "chest",
          layoutOptions: ["row","gallery","stacked"],
          searchable: true,
          onClose: () => previewApi?.hide()
        }));
        modal.classList.add("admin-only");

        // 2) list + preview + form
        const listContainer = createDefListContainer("chest-def-list");
        previewApi  = createPreviewPanel("chest");
        formApi     = createChestFormController({
          onCancel: async () => {
            formApi.reset();
            previewApi.setFromDefinition({ lootPool: [] });
            previewApi.show();
          },
          onDelete: async id => {
            await deleteChestDefinition(db, id);
            await refreshList();
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
            await refreshList();
            formApi.reset();
            previewApi.setFromDefinition({ lootPool: [] });
            previewApi.show();
          }
        }, db);

        // 3) assemble
        header.append(...listContainer.querySelectorAll(".list-header"));
        content.append(
          listContainer,
          document.createElement("hr"),
          formApi.form
        );

        // 4) wiring list manager
        listApi = createDefinitionListManager({
          container:      listContainer,
          getDefinitions: () => definitions,
          onEntryClick: async def => {
            await ensureItemMap();
            formApi.populate(def);
            previewApi.setFromDefinition({
              ...def,
              lootPool: (def.lootPool||[]).map(id=>itemMap[id]).filter(Boolean)
            });
            previewApi.show();
          },
          onDelete: async id => {
            await deleteChestDefinition(db, id);
            await refreshList();
          }
        });

        // 5) initial state
        previewApi.hide();
      }

      // every open…
      formApi.reset();
      await ensureItemMap();
      await refreshList();
      modal.open();
      initModalColorPickers(content);
      formApi.initPickrs();
      requestAnimationFrame(() => {
        previewApi.setFromDefinition({ lootPool: [] });
        previewApi.show();
      });
    }
  };
}

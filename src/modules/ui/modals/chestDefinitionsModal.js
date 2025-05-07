// @file: src/modules/ui/modals/chestDefinitionsModal.js
// @version: 1.3 — shell without preview, shell search disabled, own preview only

import { createDefinitionModalShell } from "../components/definitionModalShell.js";
import { initModalPickrs }            from "../pickrManager.js";
import { createDefListContainer }     from "../../utils/listUtils.js";
import { createDefinitionListManager }from "../components/definitionListManager.js";
import { createPreviewPanel }         from "../preview/createPreviewPanel.js";

import {
  loadChestDefinitions,
  saveChestDefinition,
  updateChestDefinition,
  deleteChestDefinition
} from "../../services/chestDefinitionsService.js";

import { createChestFormController } from "../forms/controllers/chestFormController.js";

export function initChestDefinitionsModal(db) {
  let listApi, formApi, previewApi, definitions = [];
  let modal, header, content, openShell;
  let itemMap = {};

  async function ensureItemMap() {
    if (!Object.keys(itemMap).length) {
      const items = await import("../../services/itemDefinitionsService.js")
                         .then(m => m.loadItemDefinitions(db));
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }
  }

  async function refreshList() {
    definitions = await loadChestDefinitions(db);
    listApi.refresh(definitions);
  }

  return {
    async open() {
      if (!modal) {
        // build the shell (no built-in preview, disable shell search)
        ({ modal, header, content, open: openShell } = createDefinitionModalShell({
          id:            "chest-definitions-modal",
          title:         "Manage Chest Types",
          size:          "large",
          searchable:    false,
          layoutOptions: ["row", "gallery", "stacked"],
          onClose:       () => previewApi?.hide()
        }));
        modal.classList.add("admin-only");

        // your own preview panel
        previewApi = createPreviewPanel("chest");

        // list & form
        const listContainer = createDefListContainer("chest-def-list");
        formApi = createChestFormController({
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

        // assemble
        header.append(...listContainer.querySelectorAll(".list-header"));
        content.append(
          listContainer,
          document.createElement("hr"),
          formApi.form
        );

        // list manager
        listApi = createDefinitionListManager({
          container:      listContainer,
          getDefinitions: () => definitions,
          onEntryClick: async def => {
            await ensureItemMap();
            formApi.populate(def);
            previewApi.setFromDefinition({
              ...def,
              lootPool: (def.lootPool||[]).map(id => itemMap[id]).filter(Boolean)
            });
            previewApi.show();
          },
          onDelete: async id => {
            await deleteChestDefinition(db, id);
            await refreshList();
          }
        });

        previewApi.hide();
      }

      // each open
      formApi.reset();
      await ensureItemMap();
      await refreshList();

      openShell();               // show modal
      formApi.initPickrs();      // wire per-form pickrManager
      initModalPickrs(content);  // init any color-swatch buttons inside

      previewApi.setFromDefinition({ lootPool: [] });
      previewApi.show();
    }
  };
}

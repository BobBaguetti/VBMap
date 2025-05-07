// @file: src/modules/ui/modals/chestDefinitionsModal.js
// @version: 1.8 — pass onFieldChange to form controller for live preview

import { createDefinitionModalShell } from "../components/definitionModalShell.js";
import { initModalPickrs }            from "../pickrManager.js";
import { createDefListContainer }     from "../../utils/listUtils.js";
import { createDefinitionListManager }from "../components/definitionListManager.js";
import { createPreviewController }    from "../preview/previewController.js";

import {
  loadChestDefinitions,
  saveChestDefinition,
  updateChestDefinition,
  deleteChestDefinition
} from "../../services/chestDefinitionsService.js";

import { createChestFormController } from "../forms/controllers/chestFormController.js";

export function initChestDefinitionsModal(db) {
  let listApi, formApi, definitions = [];
  let modal, header, content, openShell;
  let showPreview, hidePreview;
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
        ({ modal, header, content, open: openShell } = createDefinitionModalShell({
          id:            "chest-definitions-modal",
          title:         "Manage Chest Types",
          size:          "large",
          searchable:    false,
          layoutOptions: ["row","gallery","stacked"],
          onClose:       () => hidePreview()
        }));
        modal.classList.add("admin-only");

        // preview
        const preview = createPreviewController("chest");
        showPreview = preview.show;
        hidePreview = preview.hide;

        // list & form (pass showPreview as onFieldChange)
        const listContainer = createDefListContainer("chest-def-list");
        formApi = createChestFormController({
          onCancel: async () => {
            formApi.reset();
            showPreview({ lootPool: [] });
          },
          onDelete: async id => {
            await deleteChestDefinition(db, id);
            await refreshList();
            formApi.reset();
            showPreview({ lootPool: [] });
          },
          onSubmit: async payload => {
            if (payload.id) {
              await updateChestDefinition(db, payload.id, payload);
            } else {
              await saveChestDefinition(db, null, payload);
            }
            await refreshList();
            formApi.reset();
            showPreview({ lootPool: [] });
          },
          onFieldChange: data => {
            // rehydrate lootPool items
            const merged = {
              ...data,
              lootPool: (data.lootPool||[]).map(id => itemMap[id]).filter(Boolean)
            };
            showPreview(merged);
          }
        }, db);

        // assemble
        header.append(...listContainer.querySelectorAll(".list-header"));
        content.append(
          listContainer,
          document.createElement("hr"),
          formApi.form
        );

        listApi = createDefinitionListManager({
          container:      listContainer,
          getDefinitions: () => definitions,
          onEntryClick: async def => {
            await ensureItemMap();
            formApi.populate(def);
            formApi.initPickrs();
            const fullDef = {
              ...def,
              lootPool: (def.lootPool||[]).map(id => itemMap[id]).filter(Boolean)
            };
            showPreview(fullDef);
          },
          onDelete: async id => {
            await deleteChestDefinition(db, id);
            await refreshList();
          }
        });
      }

      // each open
      formApi.reset();
      await ensureItemMap();
      await refreshList();

      openShell();
      formApi.initPickrs();
      initModalPickrs(content);

      showPreview({ lootPool: [] });
    }
  };
}

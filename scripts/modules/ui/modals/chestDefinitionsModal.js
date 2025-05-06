// @file: /scripts/modules/ui/modals/chestDefinitionsModal.js
// @version: 4.0 – rebuilt on definitionModalShell

import { subscribeChestDefinitions, loadChestDefinitions } from "../../services/chestDefinitionsService.js";
import { loadItemDefinitions } from "../../services/itemDefinitionsService.js";

import { createDefinitionModalShell } from "../components/definitionModalShell.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createChestFormController } from "../forms/controllers/chestFormController.js";
import { createPreviewPanel } from "../preview/createPreviewPanel.js";

export function initChestDefinitionsModal(db) {
  // form API, list API, preview API, raw data
  let listApi, formApi, previewApi;
  let definitions = [];
  let itemMap = {};

  // keep an in-memory map of item defs for loot-pool preview
  async function ensureItemMap() {
    if (!Object.keys(itemMap).length) {
      const items = await loadItemDefinitions(db);
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }
  }

  // refresh raw chest defs & tell the list to re-render
  async function refreshDefinitions() {
    definitions = await loadChestDefinitions(db);
    listApi.refresh(definitions);
  }

  // build shell once:
  const shell = createDefinitionModalShell({
    id:          "chest-definitions-modal",
    title:       "Manage Chest Types",
    size:        "large",
    withPreview: true,
    previewType: "chest",
    layoutOptions: ["row","stacked","gallery"],
    onClose:     () => previewApi.hide()
  });

  // expose for sidebar to call
  return {
    open: async () => {
      // first-time wiring
      if (!listApi) {
        // 1) list manager in shell.bodyWrap
        const listContainer = document.createElement("div");
        shell.bodyWrap.appendChild(listContainer);
        listApi = createDefinitionListManager({
          container: listContainer,
          getDefinitions: () => definitions,
          onEntryClick: async def => {
            formApi.populate(def);
            await ensureItemMap();
            previewApi.setFromDefinition({
              ...def,
              lootPool: (def.lootPool||[]).map(id => itemMap[id]).filter(Boolean)
            });
            previewApi.show();
          },
          onDelete: async id => {
            await deleteChestDefinition(db, id);
            await refreshDefinitions();
          }
        });

        // 2) form controller under the list
        formApi = createChestFormController({
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
            if (payload.id)
              await updateChestDefinition(db, payload.id, payload);
            else
              await saveChestDefinition(db, null, payload);
            await refreshDefinitions();
            formApi.reset();
            previewApi.setFromDefinition({ lootPool: [] });
            previewApi.show();
          }
        }, db);
        shell.bodyWrap.appendChild(formApi.form);

        // 3) preview panel comes with the shell
        previewApi = shell.previewApi;

        // wire live preview on form input
        formApi.form.addEventListener("input", async () => {
          const live = formApi.getCurrent();
          await ensureItemMap();
          previewApi.setFromDefinition({
            ...live,
            lootPool: (live.lootPool||[]).map(id => itemMap[id]).filter(Boolean)
          });
          previewApi.show();
        });
      }

      // every open: reset, reload, then show
      formApi.reset();
      await ensureItemMap();
      await refreshDefinitions();
      shell.open();
      formApi.initPickrs();
      previewApi.setFromDefinition({ lootPool: [] });
      previewApi.show();
    }
  };
}

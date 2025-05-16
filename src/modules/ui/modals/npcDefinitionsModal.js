// @version: 1.0
// @file: src/modules/ui/modals/npcDefinitionsModal.js

import { createDefinitionModalShell }   from "../components/definitionModalShell.js";
import { createDefListContainer }      from "../../utils/listUtils.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createPreviewController }     from "../preview/previewController.js";

import {
  loadNPCs,
  createNPC,
  updateNPC,
  deleteNPC
} from "../../services/definitions/npcService.js";

import { createNPCFormController }     from "../forms/controllers/npcFormController.js";

export function initNPCDefinitionsModal(db) {
  let listApi, formApi, definitions = [];
  let modal, header, content, openShell;
  let showPreview, hidePreview;
  let itemMap = {};

  // Preload items for loot-table previews
  async function ensureItemMap() {
    if (!Object.keys(itemMap).length) {
      const items = await import("../../services/itemDefinitionsService.js")
                         .then(m => m.loadItemDefinitions(db));
      itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }
  }

  async function refreshList() {
    definitions = await loadNPCs(db);
    listApi.refresh(definitions);
  }

  return {
    async open() {
      if (!modal) {
        ({ modal, header, content, open: openShell } = createDefinitionModalShell({
          id:            "npc-definitions-modal",
          title:         "Manage NPCs",
          size:          "large",
          searchable:    true,
          layoutOptions: ["row","gallery","stacked"],
          onClose:       () => hidePreview()
        }));
        modal.classList.add("admin-only");

        // Preview pane
        const preview = createPreviewController("npc");
        showPreview = preview.show;
        hidePreview = preview.hide;

        // List + Form
        const listContainer = createDefListContainer("npc-def-list");
        formApi = createNPCFormController({
          onCancel: async () => {
            formApi.reset();
            showPreview({});
          },
          onDelete: async id => {
            await deleteNPC(db, id);
            await refreshList();
            formApi.reset();
            showPreview({});
          },
          onSubmit: async payload => {
            if (payload.id) {
              await updateNPC(db, payload.id, payload);
            } else {
              await createNPC(db, payload);
            }
            await refreshList();
            formApi.reset();
            showPreview({});
          },
          onFieldChange: data => {
            // For preview, map lootTable IDs to full items
            const previewData = {
              ...data,
              lootTable: (data.lootTable || [])
                .map(id => itemMap[id])
                .filter(Boolean)
            };
            showPreview(previewData);
          }
        }, db);

        header.append(...listContainer.querySelectorAll(".list-header"));
        content.append(
          listContainer,
          document.createElement("hr"),
          formApi.form
        );

        // Definition List Manager
        listApi = createDefinitionListManager({
          container:      listContainer,
          getDefinitions: () => definitions,
          onEntryClick: async def => {
            await ensureItemMap();
            formApi.populate(def);
            const previewData = {
              ...def,
              lootTable: (def.lootTable || [])
                .map(id => itemMap[id])
                .filter(Boolean)
            };
            showPreview(previewData);
          },
          onDelete: async id => {
            await deleteNPC(db, id);
            await refreshList();
          }
        });

        // Search → Filter
        const shellSearch = modal.querySelector(".modal__search");
        if (shellSearch) {
          shellSearch.addEventListener("input", () => {
            listApi.filter(shellSearch.value);
          });
        }
      }

      // On each open
      formApi.reset();
      await ensureItemMap();
      await refreshList();
      openShell();
      formApi.initPickrs();  // if you have pickers
      showPreview({});
    }
  };
}

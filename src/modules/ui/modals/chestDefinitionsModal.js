// @file: src/modules/ui/modals/chestDefinitionsModal.js
// @version: 1.5 — plug in getCurrentPayload to previewController

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
  let showPreview, liveReShow, hidePreview;
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

        // preview wiring
        const preview = createPreviewController("chest", () => formApi.getCurrentPayload());
        showPreview  = preview.show;
        liveReShow   = preview.liveReShow;
        hidePreview  = preview.hide;

        // list & form
        const listContainer = createDefListContainer("chest-def-list");
        formApi = createChestFormController({
          onCancel: async () => {
            formApi.reset();
            liveReShow();
          },
          onDelete: async id => {
            await deleteChestDefinition(db, id);
            await refreshList();
            formApi.reset();
            liveReShow();
          },
          onSubmit: async payload => {
            if (payload.id) {
              await updateChestDefinition(db, payload.id, payload);
            } else {
              await saveChestDefinition(db, null, payload);
            }
            await refreshList();
            formApi.reset();
            liveReShow();
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
            formApi.initPickrs();
            liveReShow();
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

      liveReShow();
    }
  };
}

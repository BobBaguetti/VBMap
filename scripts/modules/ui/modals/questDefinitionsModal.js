// @file: /scripts/modules/ui/modals/questDefinitionsModal.js
// @version: 7

import { createDefinitionModalShell }   from "../components/definitionModalShell.js";
import { createDefListContainer }       from "../../utils/listUtils.js";
import {
  loadQuestDefinitions,
  saveQuestDefinition,
  updateQuestDefinition,
  deleteQuestDefinition
}                                       from "../../services/questDefinitionsService.js";
import { createDefinitionListManager }   from "../components/definitionListManager.js";
import { createQuestFormController }     from "../forms/controllers/questFormController.js";
import { renderQuestEntry }              from "../entries/questEntryRenderer.js";

// ← NEW: import the scoped initializer
import { initModalPickrs }              from "../pickrManager.js";

export function initQuestDefinitionsModal(db) {
  const {
    modal,
    header,
    bodyWrap,
    previewApi,
    open: openModal
  } = createDefinitionModalShell({
    id: "quest-definitions-modal",
    title: "Manage Quests",
    withPreview: true,
    previewType: "quest",
    layoutOptions: ["row", "stacked", "gallery"],
    onClose: () => previewApi.hide()
  });

  // ─── hide entire modal for non-admins ──────────────────────────────
  modal.classList.add("admin-only");

  // list + search (dark) will be inserted by list-manager
  const listContainer = createDefListContainer("quest-def-list");
  bodyWrap.appendChild(listContainer);

  // form (includes its own Add/Edit header + buttons)
  const formApi = createQuestFormController({
    onCancel: () => formApi.reset(),
    onDelete: async id => {
      await deleteQuestDefinition(db, id);
      formApi.reset();
      await refresh();
    },
    onSubmit: async payload => {
      if (payload.id) await updateQuestDefinition(db, payload.id, payload);
      else             await saveQuestDefinition(db, null, payload);
      formApi.reset();
      await refresh();
    }
  });
  formApi.form.classList.add("ui-scroll-float");

  bodyWrap.appendChild(document.createElement("hr"));
  bodyWrap.appendChild(formApi.form);

  // list manager wiring
  let definitions = [];
  const listApi = createDefinitionListManager({
    container:      listContainer,
    getDefinitions: () => definitions,
    renderEntry:    (def, layout) => renderQuestEntry(def, layout, {
      onClick:  d => {
        formApi.populate(d);
        previewApi.setFromDefinition(d);
        previewApi.show();
      },
      onDelete: id => deleteQuestDefinition(db, id).then(refresh)
    })
  });

  async function refresh() {
    definitions = await loadQuestDefinitions(db);
    listApi.refresh(definitions);
  }

  // move dark search bar into modal header
  const hdr = listContainer.previousElementSibling;
  if (hdr?.classList.contains("list-header")) {
    hdr.remove();
    header.appendChild(hdr);
  }

  previewApi.hide();

  return {
    open: async () => {
      formApi.reset();
      await refresh();
      openModal();
      // ← NEW: wire up all color‐swatch buttons in this modal
      initModalPickrs(bodyWrap);
      previewApi.show();
    },
    refresh
  };
}

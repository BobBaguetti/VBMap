// @file: /scripts/modules/ui/modals/npcDefinitionsModal.js
// @version: 7

import { createDefinitionModalShell } from "../components/definitionModalShell.js";
import { createDefListContainer }     from "../../utils/listUtils.js";
import {
  loadNpcDefinitions, saveNpcDefinition, updateNpcDefinition,
  deleteNpcDefinition
}                                     from "../../services/npcDefinitionsService.js";
import { createDefinitionListManager } from "../components/definitionListManager.js";
import { createNpcFormController }     from "../forms/controllers/npcFormController.js";
import { renderNpcEntry }              from "../entries/npcEntryRenderer.js";

// ← NEW: import our scoped initializer
import { initModalPickrs }            from "../pickrManager.js";

export function initNpcDefinitionsModal(db) {
  const {
    modal,
    header,
    bodyWrap,
    previewApi,
    open: openModal
  } = createDefinitionModalShell({
    id: "npc-definitions-modal",
    title: "Manage NPCs",
    withPreview: true,
    previewType: "npc",
    layoutOptions: ["row", "stacked", "gallery"],
    onClose: () => previewApi.hide()
  });

  // ─── hide entire modal for non-admins ──────────────────────────────
  modal.classList.add("admin-only");

  // list + search (dark) injected by definitionListManager
  const listContainer = createDefListContainer("npc-def-list");
  bodyWrap.appendChild(listContainer);

  // form (includes its own Add/Edit header + buttons)
  const formApi = createNpcFormController({
    onCancel: () => formApi.reset(),
    onDelete: async id => {
      await deleteNpcDefinition(db, id);
      formApi.reset();
      await refresh();
    },
    onSubmit: async payload => {
      if (payload.id) await updateNpcDefinition(db, payload.id, payload);
      else             await saveNpcDefinition(db, null, payload);
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
    renderEntry:    (def, layout) => renderNpcEntry(def, layout, {
      onClick:  d => {
        formApi.populate(d);
        previewApi.setFromDefinition(d);
        previewApi.show();
      },
      onDelete: id => deleteNpcDefinition(db, id).then(refresh)
    })
  });

  async function refresh() {
    definitions = await loadNpcDefinitions(db);
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

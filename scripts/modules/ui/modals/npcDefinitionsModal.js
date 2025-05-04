// @file: /scripts/modules/ui/modals/npcDefinitionsModal.js
// @version: 2.3 – add form heading and align action buttons

import { createDefinitionModalShell }   from "../components/definitionModalShell.js";
import { createDefListContainer }       from "../../utils/listUtils.js";
import {
  loadNpcDefinitions,
  subscribeNpcDefinitions,
  addNpcDefinition,
  updateNpcDefinition,
  deleteNpcDefinition
}                                       from "../../services/npcDefinitionsService.js";
import { createDefinitionListManager }  from "../components/definitionListManager.js";
import { createNpcFormController }      from "../forms/controllers/npcFormController.js";
import { renderNpcEntry }               from "../entries/npcEntryRenderer.js";
import { initModalPickrs }              from "../pickrManager.js";

export function initNpcDefinitionsModal(db) {
  let modal, header, bodyWrap, previewApi, openModal;
  let formApi, listApi, unsubscribe;

  // Create heading + actions container
  const formHeader = document.createElement("h3");
  formHeader.className = "form-heading";
  const actionRow = document.createElement("div");
  actionRow.className = "modal-actions";

  async function refreshList() {
    const defs = await loadNpcDefinitions(db);
    listApi.refresh(defs);
  }

  function startSubscription() {
    unsubscribe?.();
    unsubscribe = subscribeNpcDefinitions(db, defs => {
      listApi.refresh(defs);
    });
  }

  async function open() {
    if (!modal) {
      // 1) Build shell (use default toolbar behavior)
      const shell = createDefinitionModalShell({
        id:           "npc-definitions-modal",
        title:        "Manage NPCs",
        withPreview:  true,
        previewType:  "npc",
        layoutOptions:["row", "stacked", "gallery"]
      });
      modal      = shell.modal;
      header     = shell.header;
      bodyWrap   = shell.bodyWrap;
      previewApi = shell.previewApi;
      openModal  = shell.open;

      modal.classList.add("admin-only");

      // 2) Definition list
      const listContainer = createDefListContainer("npc-def-list");
      bodyWrap.appendChild(listContainer);
      listApi = createDefinitionListManager({
        container:      listContainer,
        getDefinitions: () => [],
        renderEntry:    (def, layout) => renderNpcEntry(def, layout, {
          onClick:  d => {
            formApi.populate(d);
            _showEditActions();
            previewApi.setFromDefinition(d);
            previewApi.show();
          },
          onDelete: async id => {
            if (confirm(`Delete NPC "${id}"?`)) {
              await deleteNpcDefinition(db, id);
              formApi.reset();
              previewApi.hide();
              _showAddActions();
            }
          }
        })
      });

      // 3) Form controller
      formApi = createNpcFormController(db, {
        onCancel: async () => {
          formApi.reset();
          previewApi.hide();
          _showAddActions();
        },
        onDelete: async id => {
          if (confirm(`Delete NPC "${id}"?`)) {
            await deleteNpcDefinition(db, id);
            formApi.reset();
            previewApi.hide();
            _showAddActions();
          }
        },
        onSubmit: async def => {
          if (def.id) await updateNpcDefinition(db, def.id, def);
          else          await addNpcDefinition(db, def);
          formApi.reset();
          previewApi.hide();
          _showAddActions();
        }
      });
      formApi.form.classList.add("ui-scroll-float");

      // 4) Move search bar into header
      const maybeHeader = listContainer.previousElementSibling;
      if (maybeHeader?.classList.contains("list-header")) {
        maybeHeader.remove();
        header.appendChild(maybeHeader);
      }

      // 5) Initialize pickers & hide preview
      initModalPickrs(bodyWrap);
      previewApi.hide();

      // 6) Start subscription & initial load
      startSubscription();
      await refreshList();

      // 7) Insert heading, form, and actions
      bodyWrap.appendChild(document.createElement("hr"));
      bodyWrap.appendChild(formHeader);
      bodyWrap.appendChild(formApi.form);
      bodyWrap.appendChild(actionRow);

      // 8) Build action buttons and default to Add mode
      _buildActions();
      _showAddActions();
    }

    formApi.reset();
    previewApi.hide();
    _showAddActions();
    openModal();
  }

  // Build the Save/Clear and Save/Cancel/Delete buttons
  function _buildActions() {
    actionRow.innerHTML = "";

    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.textContent = "Save";
    btnSave.className = "ui-button";
    btnSave.onclick = () => formApi.form.requestSubmit();

    const btnClear = document.createElement("button");
    btnClear.type = "button";
    btnClear.textContent = "Clear";
    btnClear.className = "ui-button";
    btnClear.onclick = () => formApi.reset();

    const btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.textContent = "Cancel";
    btnCancel.className = "ui-button";
    btnCancel.onclick = () => formApi.reset() | previewApi.hide() | _showAddActions();

    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.textContent = "Delete";
    btnDelete.className = "ui-button-danger";
    btnDelete.onclick = () => formApi.onDelete?.(formApi.getId());

    actionRow.append(btnSave, btnClear, btnCancel, btnDelete);
  }

  function _showAddActions() {
    formHeader.textContent = "Add NPC";
    actionRow.children[0].style.display = "";  // Save
    actionRow.children[1].style.display = "";  // Clear
    actionRow.children[2].style.display = "none";// Cancel
    actionRow.children[3].style.display = "none";// Delete
  }

  function _showEditActions() {
    formHeader.textContent = "Edit NPC";
    actionRow.children[0].style.display = "";  // Save
    actionRow.children[1].style.display = "none";// Clear
    actionRow.children[2].style.display = "";  // Cancel
    actionRow.children[3].style.display = "";  // Delete
  }

  return { open };
}

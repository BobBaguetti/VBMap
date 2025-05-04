// @file: /scripts/modules/ui/modals/npcDefinitionsModal.js
// @version: 2.2 – inject form action buttons (Save/Clear, Save/Cancel/Delete)

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
      // 1) Build shell (no toolbar override)
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
          if (def.id) {
            await updateNpcDefinition(db, def.id, def);
          } else {
            await addNpcDefinition(db, def);
          }
          formApi.reset();
          previewApi.hide();
          _showAddActions();
        }
      });
      formApi.form.classList.add("ui-scroll-float");

      // Insert form and action row
      bodyWrap.appendChild(document.createElement("hr"));
      bodyWrap.appendChild(formApi.form);
      bodyWrap.appendChild(actionRow);

      // 4) Move search bar into header
      const maybeHeader = listContainer.previousElementSibling;
      if (maybeHeader?.classList.contains("list-header")) {
        maybeHeader.remove();
        header.appendChild(maybeHeader);
      }

      // 5) Init pickers & hide preview
      initModalPickrs(bodyWrap);
      previewApi.hide();

      // 6) Start subscription & load
      startSubscription();
      await refreshList();

      // Setup action buttons
      _buildActions();
      _showAddActions();
    }

    formApi.reset();
    previewApi.hide();
    _showAddActions();
    openModal();
  }

  // Build Save/Clear and Save/Cancel/Delete buttons
  function _buildActions() {
    actionRow.innerHTML = "";

    // Save button
    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.textContent = "Save";
    btnSave.className = "ui-button";
    btnSave.onclick = () => formApi.form.requestSubmit();

    // Clear button (only in Add mode)
    const btnClear = document.createElement("button");
    btnClear.type = "button";
    btnClear.textContent = "Clear";
    btnClear.className = "ui-button";
    btnClear.onclick = () => formApi.reset();

    // Cancel button (only in Edit mode)
    const btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.textContent = "Cancel";
    btnCancel.className = "ui-button";
    btnCancel.onclick = async () => formApi.reset() | previewApi.hide() | _showAddActions();

    // Delete button (only in Edit mode)
    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.textContent = "Delete";
    btnDelete.className = "ui-button-danger";
    btnDelete.onclick = () => formApi.onDelete?.(formApi.getId());

    actionRow.append(btnSave, btnClear, btnCancel, btnDelete);
  }

  // Toggle actions for Add vs Edit
  function _showAddActions() {
    actionRow.children[0].style.display = ""; // Save
    actionRow.children[1].style.display = ""; // Clear
    actionRow.children[2].style.display = "none"; // Cancel
    actionRow.children[3].style.display = "none"; // Delete
  }
  function _showEditActions() {
    actionRow.children[0].style.display = "";  // Save
    actionRow.children[1].style.display = "none"; // Clear
    actionRow.children[2].style.display = "";  // Cancel
    actionRow.children[3].style.display = "";  // Delete
  }

  return { open };
}

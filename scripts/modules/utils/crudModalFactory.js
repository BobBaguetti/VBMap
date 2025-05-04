// @file: /scripts/utils/crudModalFactory.js
// @version: 1.3 – fix imports to point at modules folder

import { createDefinitionModalShell }   from "../modules/ui/components/definitionModalShell.js";
import { createDefListContainer }       from "../modules/utils/listUtils.js";
import { createDefinitionListManager }  from "../modules/ui/components/definitionListManager.js";
import { initModalPickrs }              from "../modules/ui/pickrManager.js";

/**
 * Initializes a CRUD modal for any collection.
 *
 * @param {Object} cfg
 * @param {string} cfg.id             – unique modal DOM id
 * @param {string} cfg.title          – modal window title
 * @param {object} cfg.db             – Firestore DB instance
 * @param {Function} cfg.loadAll      – () => Promise<definitions[]>
 * @param {Function} cfg.subscribeAll – (cb) => unsubscribeFn
 * @param {Function} cfg.onSave       – (def) => Promise
 * @param {Function} cfg.onDelete     – (id)  => Promise
 * @param {Function} cfg.renderEntry  – (def, { onClick, onDelete }) => HTMLElement
 * @param {Function} cfg.formFactory  – (db, { onSubmit, onCancel, onDelete }) => { form, populate, reset, getId, getCurrent }
 * @param {string|null} cfg.previewType   – "item"|"chest"|"npc"|"quest" or null
 * @param {string[]} cfg.layoutOptions    – e.g. ["row","stacked","gallery"]
 *
 * @returns {{ open: Function }}  an object with an `open()` method
 */
export function initCrudModal({
  id, title, db,
  loadAll, subscribeAll,
  onSave, onDelete,
  renderEntry, formFactory,
  previewType = null, layoutOptions = ["row","stacked","gallery"]
}) {
  let shell, listApi, formApi, previewApi, unsubscribe;
  let listContainer, formHeader, actionRow;

  async function refreshList() {
    const defs = await loadAll();
    listApi.refresh(defs);
  }

  function startSubscription() {
    unsubscribe?.();
    unsubscribe = subscribeAll(defs => listApi.refresh(defs));
  }

  function buildShell() {
    // Ensure listContainer exists
    listContainer = listContainer || createDefListContainer(id + "-list");

    shell = createDefinitionModalShell({
      id, title,
      withPreview:   !!previewType,
      previewType, layoutOptions
    });
    const { header, bodyWrap, previewApi: p, open: shellOpen } = shell;
    previewApi = p;

    // Relocate search bar from list into header
    const searchHeader = listContainer.previousElementSibling;
    if (searchHeader) header.appendChild(searchHeader);

    // Create form heading & actions container
    formHeader = document.createElement("h3");
    formHeader.className = "form-heading";
    actionRow = document.createElement("div");
    actionRow.className = "modal-actions";

    // Assemble modal body
    bodyWrap.appendChild(listContainer);
    bodyWrap.appendChild(document.createElement("hr"));
    bodyWrap.appendChild(formHeader);
    bodyWrap.appendChild(formApi.form);
    bodyWrap.appendChild(actionRow);

    // Initialize color pickers
    initModalPickrs(bodyWrap);

    // Override open to reset to Add mode after showing
    shell.open = () => {
      shellOpen();
      _showAdd();
    };
  }

  function buildList() {
    listApi = createDefinitionListManager({
      container:      listContainer,
      getDefinitions: loadAll,
      renderEntry: def => renderEntry(def, {
        onClick: async d => {
          formApi.populate(d);
          _showEdit();
          previewApi.setFromDefinition(d);
          previewApi.show();
        },
        onDelete: async id => {
          await onDelete(id);
          formApi.reset();
          previewApi.hide();
          _showAdd();
        }
      })
    });
  }

  function buildForm() {
    formApi = formFactory(db, {
      onCancel: async () => {
        formApi.reset();
        previewApi.hide();
        _showAdd();
      },
      onDelete: async id => {
        await onDelete(id);
        formApi.reset();
        previewApi.hide();
        _showAdd();
      },
      onSubmit: async def => {
        await onSave(def);
        await refreshList();
        formApi.reset();
        previewApi.hide();
        _showAdd();
      }
    });
    formApi.form.classList.add("ui-scroll-float");

    // Live preview on input
    formApi.form.addEventListener("input", () => {
      const cur = formApi.getCurrent?.();
      if (cur) {
        previewApi.setFromDefinition(cur);
        previewApi.show();
      }
    });
  }

  function buildActions() {
    actionRow.innerHTML = "";
    const btnSave   = createBtn("Save",   () => formApi.form.requestSubmit());
    const btnClear  = createBtn("Clear",  () => formApi.reset());
    const btnCancel = createBtn("Cancel", () => { formApi.reset(); previewApi.hide(); _showAdd(); });
    const btnDelete = createBtn("Delete", () => formApi.onDelete?.(formApi.getId()));
    actionRow.append(btnSave, btnClear, btnCancel, btnDelete);
  }

  function createBtn(label, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.className = label === "Delete" ? "ui-button-danger" : "ui-button";
    btn.onclick = onClick;
    return btn;
  }

  function _showAdd() {
    formHeader.textContent = `Add ${title.replace(/^Manage\s+/, "")}`;
    actionRow.children[0].style.display = "";   // Save
    actionRow.children[1].style.display = "";   // Clear
    actionRow.children[2].style.display = "none"; // Cancel
    actionRow.children[3].style.display = "none"; // Delete
  }

  function _showEdit() {
    formHeader.textContent = `Edit ${title.replace(/^Manage\s+/, "")}`;
    actionRow.children[0].style.display = "";   // Save
    actionRow.children[1].style.display = "none"; // Clear
    actionRow.children[2].style.display = "";   // Cancel
    actionRow.children[3].style.display = "";   // Delete
  }

  return {
    async open() {
      if (!shell) {
        buildForm();
        buildShell();
        buildActions();
        buildList();
        startSubscription();
        await refreshList();
      }
      formApi.reset();
      previewApi.hide();
      shell.open();
    }
  };
}

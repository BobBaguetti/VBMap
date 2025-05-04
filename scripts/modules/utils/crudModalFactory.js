// @file: /scripts/utils/crudModalFactory.js
// @version: 1 – centralized CRUD‐modal factory

import { createDefinitionModalShell }   from "../ui/components/definitionModalShell.js";
import { createDefListContainer }       from "../utils/listUtils.js";
import { createDefinitionListManager }  from "../ui/components/definitionListManager.js";
import { initModalPickrs }              from "../ui/pickrManager.js";

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
    shell = createDefinitionModalShell({
      id, title,
      withPreview:   !!previewType,
      previewType, layoutOptions
    });
    const { header, bodyWrap, previewApi: p, open: shellOpen } = shell;
    previewApi = p;

    // relocate search bar from list into header
    header.appendChild(listContainer.previousElementSibling);

    // create form header and action row
    formHeader = document.createElement("h3");
    formHeader.className = "form-heading";

    actionRow = document.createElement("div");
    actionRow.className = "modal-actions";

    // insert regions
    bodyWrap.appendChild(listContainer);
    bodyWrap.appendChild(document.createElement("hr"));
    bodyWrap.appendChild(formHeader);
    bodyWrap.appendChild(formApi.form);
    bodyWrap.appendChild(actionRow);

    // init pickers
    initModalPickrs(bodyWrap);

    shell.open = () => {
      shellOpen();
      // after open, ensure correct mode & heading
      _showAdd();
    };
  }

  function buildList() {
    listContainer = createDefListContainer(id + "-list");
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
        onDelete: async itemId => {
          await onDelete(itemId);
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

    // live preview on input
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
    const btnCancel = createBtn("Cancel", () => formApi.reset() || previewApi.hide() || _showAdd());
    const btnDelete = createBtn("Delete", () => formApi.onDelete?.(formApi.getId()));

    actionRow.append(btnSave, btnClear, btnCancel, btnDelete);
  }

  function createBtn(label, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.className = label === "Delete" ? "ui-button-danger" : "ui-button";
    b.onclick = onClick;
    return b;
  }

  function _showAdd() {
    formHeader.textContent = `Add ${title.replace(/^Manage\s+/, "")}`;
    actionRow.children[0].style.display = "";  // Save
    actionRow.children[1].style.display = "";  // Clear
    actionRow.children[2].style.display = "none";// Cancel
    actionRow.children[3].style.display = "none";// Delete
  }

  function _showEdit() {
    formHeader.textContent = `Edit ${title.replace(/^Manage\s+/, "")}`;
    actionRow.children[0].style.display = "";  // Save
    actionRow.children[1].style.display = "none";// Clear
    actionRow.children[2].style.display = "";  // Cancel
    actionRow.children[3].style.display = "";  // Delete
  }

  return {
    async open() {
      if (!shell) {
        buildList();
        buildForm();
        buildActions();
        buildShell();
        startSubscription();
        await refreshList();
      }
      formApi.reset();
      previewApi.hide();
      shell.open();
    }
  };
}

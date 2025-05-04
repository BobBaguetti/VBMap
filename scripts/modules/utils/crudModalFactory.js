// @file: /scripts/modules/utils/crudModalFactory.js
// @version: 1.5 – normalize Firestore snapshots to Arrays in refreshList

import { createDefinitionModalShell }   from "../ui/components/definitionModalShell.js";
import { createDefListContainer }       from "./listUtils.js";
import { createDefinitionListManager }  from "../ui/components/definitionListManager.js";
import { initModalPickrs }              from "../ui/pickrManager.js";

/**
 * Initializes a CRUD modal for any collection.
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
    // Fetch raw data (could be snapshot or plain Array)
    let defs = await loadAll();

    // If Firestore QuerySnapshot, map to Array
    if (defs && typeof defs.docs !== "undefined" && Array.isArray(defs.docs)) {
      defs = defs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    listApi.refresh(defs);
  }

  function startSubscription() {
    unsubscribe?.();
    unsubscribe = subscribeAll(defs => {
      // Normalize subscription payload too
      let arr = defs;
      if (arr && typeof arr.docs !== "undefined" && Array.isArray(arr.docs)) {
        arr = arr.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      listApi.refresh(arr);
    });
  }

  function buildShell() {
    listContainer = listContainer || createDefListContainer(id + "-list");

    shell = createDefinitionModalShell({
      id, title,
      withPreview:   !!previewType,
      previewType, layoutOptions
    });
    const { header, bodyWrap, previewApi: p, open: shellOpen } = shell;
    previewApi = p;

    // Move search header
    const searchHdr = listContainer.previousElementSibling;
    if (searchHdr) header.appendChild(searchHdr);

    formHeader = document.createElement("h3");
    formHeader.className = "form-heading";
    actionRow  = document.createElement("div");
    actionRow.className = "modal-actions";

    bodyWrap.appendChild(listContainer);
    bodyWrap.appendChild(document.createElement("hr"));
    bodyWrap.appendChild(formHeader);
    bodyWrap.appendChild(formApi.form);
    bodyWrap.appendChild(actionRow);

    initModalPickrs(bodyWrap);

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
    const btnSave   = _createBtn("Save",   () => formApi.form.requestSubmit());
    const btnClear  = _createBtn("Clear",  () => formApi.reset());
    const btnCancel = _createBtn("Cancel", () => { formApi.reset(); previewApi.hide(); _showAdd(); });
    const btnDelete = _createBtn("Delete", () => formApi.onDelete?.(formApi.getId()));
    actionRow.append(btnSave, btnClear, btnCancel, btnDelete);
  }

  function _createBtn(label, onClick) {
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

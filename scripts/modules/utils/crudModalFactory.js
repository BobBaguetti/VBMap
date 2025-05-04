// @file: /scripts/modules/utils/crudModalFactory.js
// @version: 1.9 – fixed buildList to use renderEntry(def, layout, …)

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
  let cachedDefs = [];

  async function refreshList() {
    let defs = await loadAll();
    if (defs && defs.docs && Array.isArray(defs.docs)) {
      defs = defs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    cachedDefs = defs;
    listApi.refresh(cachedDefs);
  }

  function startSubscription() {
    unsubscribe?.();
    unsubscribe = subscribeAll(snap => {
      let arr = snap;
      if (arr && arr.docs && Array.isArray(arr.docs)) {
        arr = arr.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      cachedDefs = arr;
      listApi.refresh(cachedDefs);
    });
  }

  function buildShell() {
    listContainer = listContainer || createDefListContainer(id + "-list");

    shell = createDefinitionModalShell({
      id, title,
      withPreview: !!previewType,
      previewType, layoutOptions
    });
    const { header, bodyWrap, previewApi: p, open: shellOpen } = shell;
    previewApi = p;

    const searchHdr = listContainer.previousElementSibling;
    if (searchHdr) header.appendChild(searchHdr);

    formHeader = document.createElement("h3");
    formHeader.className = "form-heading";
    actionRow = document.createElement("div");
    actionRow.className = "modal-actions";

    const headingRow = document.createElement("div");
    headingRow.style.display = "flex";
    headingRow.style.justifyContent = "space-between";
    headingRow.style.alignItems = "center";
    headingRow.append(formHeader, actionRow);

    bodyWrap.appendChild(listContainer);
    bodyWrap.appendChild(document.createElement("hr"));
    bodyWrap.appendChild(headingRow);
    bodyWrap.appendChild(formApi.form);

    initModalPickrs(bodyWrap);

    shell.open = () => {
      shellOpen();
      _showAdd();
    };
  }

  function buildList() {
    listApi = createDefinitionListManager({
      container: listContainer,
      getDefinitions: () => cachedDefs,
      renderEntry: (def, layout) =>
        renderEntry(def, layout, {
          onClick: d => {
            formApi.populate(d);
            _showEdit();
            previewApi.setFromDefinition(d);
            previewApi.show();
          },
          onDelete: async id => {
            if (confirm(`Delete NPC "${id}"?`)) {
              await onDelete(id);
              formApi.reset();
              previewApi.hide();
              _showAdd();
              await refreshList();
            }
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
        if (confirm(`Delete NPC "${id}"?`)) {
          await onDelete(id);
          formApi.reset();
          previewApi.hide();
          _showAdd();
          await refreshList();
        }
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
    const btnSave = _createBtn("Save", () => formApi.form.requestSubmit());
    const btnClear = _createBtn("Clear", () => formApi.reset());
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
    actionRow.children[0].style.display = "";
    actionRow.children[1].style.display = "";
    actionRow.children[2].style.display = "none";
    actionRow.children[3].style.display = "none";
  }

  function _showEdit() {
    formHeader.textContent = `Edit ${title.replace(/^Manage\s+/, "")}`;
    actionRow.children[0].style.display = "";
    actionRow.children[1].style.display = "none";
    actionRow.children[2].style.display = "";
    actionRow.children[3].style.display = "";
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

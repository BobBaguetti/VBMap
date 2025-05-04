// @file: /scripts/modules/utils/crudModalFactory.js
// @version: 1.14 – full-file drop-in with unified buildList

import { createDefinitionModalShell }   from "../ui/components/definitionModalShell.js";
import { createDefListContainer }       from "./listUtils.js";
import { createDefinitionListManager }  from "../ui/components/definitionListManager.js";
import { initModalPickrs }              from "../ui/pickrManager.js";

/**
 * Initializes a CRUD modal for any collection.
 */
export function initCrudModal({
  id,
  title,
  db,
  loadAll,
  subscribeAll,
  onSave,
  onDelete,
  renderEntry,
  formFactory,
  previewType = null,
  layoutOptions = ["row", "stacked", "gallery"],
  toolbar = []
}) {
  let shell, listApi, formApi, previewApi, unsubscribe;
  let listContainer, formHeader, actionRow;
  let cachedDefs = [];

  // Load definitions once
  async function refreshList() {
    const result = await loadAll();
    let defs = [];

    if (result && Array.isArray(result.docs)) {
      // Firestore snapshot
      defs = result.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else if (Array.isArray(result)) {
      // Plain array
      defs = result;
    }

    cachedDefs = defs;
    listApi.refresh(cachedDefs);
  }

  // Subscribe to real-time updates
  function startSubscription() {
    unsubscribe?.();
    unsubscribe = subscribeAll(snap => {
      let defs = [];

      if (snap && Array.isArray(snap.docs)) {
        defs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else if (Array.isArray(snap)) {
        defs = snap;
      }

      cachedDefs = defs;
      listApi.refresh(cachedDefs);
    });
  }

  // Build the modal shell
  function buildShell() {
    listContainer = listContainer || createDefListContainer(id + "-list");

    shell = createDefinitionModalShell({
      id,
      title,
      toolbar,
      withPreview: !!previewType,
      previewType,
      layoutOptions
    });
    const { header, bodyWrap, previewApi: p, open: shellOpen } = shell;
    previewApi = p;

    // Move the search header into the modal header
    const searchHdr = listContainer.previousElementSibling;
    if (searchHdr) header.appendChild(searchHdr);

    // Prepare form header and action buttons container
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

  // Build the list with unified callback signature
  function buildList() {
    listApi = createDefinitionListManager({
      container: listContainer,
      getDefinitions: () => cachedDefs,
      renderEntry: (def, layout, { onClick, onDelete }) => {
        // First wire up the modal’s form/preview callbacks
        const entryEl = renderEntry(def, layout, {
          onClick: () => {
            formApi.populate(def);
            _showEdit();
            previewApi.setFromDefinition(def);
            previewApi.show();
            // Then let the list manager handle its own click logic
            onClick(def);
          },
          onDelete: async () => {
            if (confirm(`Delete ${title.replace(/^Manage\s+/, "")} "${def.id}"?`)) {
              await onDelete(def.id);
              formApi.reset();
              previewApi.hide();
              _showAdd();
              await refreshList();
              onDelete(def.id);
            }
          }
        });
        return entryEl;
      }
    });
  }

  // Build the form
  function buildForm() {
    formApi = formFactory(db, {
      onCancel: async () => {
        formApi.reset();
        previewApi.hide();
        _showAdd();
      },
      onDelete: async id => {
        if (confirm(`Delete ${title.replace(/^Manage\s+/, "")} "${id}"?`)) {
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

  // Build action buttons
  function buildActions() {
    actionRow.innerHTML = "";
    actionRow.append(
      _createBtn("Save", () => formApi.form.requestSubmit()),
      _createBtn("Clear", () => formApi.reset()),
      _createBtn("Cancel", () => { formApi.reset(); previewApi.hide(); _showAdd(); }),
      _createBtn("Delete", () => formApi.onDelete?.(formApi.getId()))
    );
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

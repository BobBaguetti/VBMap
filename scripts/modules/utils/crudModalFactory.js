// @file: /scripts/modules/utils/crudModalFactory.js
// @version: 1.18 – correctly wire list-manager callbacks into your custom renderer

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
  renderEntry: customRenderEntry,
  formFactory,
  previewType = null,
  layoutOptions = ["row","stacked","gallery"],
  toolbar = []
}) {
  let shell, listApi, formApi, previewApi, unsubscribe;
  let listContainer, formHeader, actionRow;
  let cachedDefs = [];

  async function refreshList() {
    const result = await loadAll();
    cachedDefs = result && result.docs
      ? result.docs.map(d => ({ id: d.id, ...d.data() }))
      : Array.isArray(result)
        ? result
        : [];
    listApi.refresh(cachedDefs);
  }

  function startSubscription() {
    unsubscribe?.();
    unsubscribe = subscribeAll(snap => {
      cachedDefs = snap && snap.docs
        ? snap.docs.map(d => ({ id: d.id, ...d.data() }))
        : Array.isArray(snap)
          ? snap
          : [];
      listApi.refresh(cachedDefs);
    });
  }

  function buildShell() {
    listContainer = listContainer || createDefListContainer(id + "-list");
    shell = createDefinitionModalShell({
      id, title, toolbar,
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
      renderEntry: (def, layout, cbs) => {
        // wrap the list-manager callbacks (cbs) with your form/preview logic
        const wrappedCbs = {
          onClick: () => {
            formApi.populate(def);
            _showEdit();
            previewApi.setFromDefinition(def);
            previewApi.show();
            cbs.onClick?.(def);
          },
          onDelete: async () => {
            if (confirm(`Delete ${title.replace(/^Manage\s+/, "")} "${def.id}"?`)) {
              await onDelete(def.id);
              formApi.reset();
              previewApi.hide();
              _showAdd();
              await refreshList();
              cbs.onDelete?.(def.id);
            }
          }
        };
        // call your passed‐in renderer with those wrapped callbacks
        return customRenderEntry(def, layout, wrappedCbs);
      }
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

  function buildActions() {
    actionRow.innerHTML = "";
    actionRow.append(
      _btn("Save",   () => formApi.form.requestSubmit()),
      _btn("Clear",  () => formApi.reset()),
      _btn("Cancel", () => { formApi.reset(); previewApi.hide(); _showAdd(); }),
      _btn("Delete", () => formApi.onDelete?.(formApi.getId()))
    );
  }

  function _btn(label, onClick) {
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

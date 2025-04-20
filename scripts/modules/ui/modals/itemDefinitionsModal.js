// @version: 10
// @file: /scripts/modules/ui/modals/itemDefinitionsModal.js

import {
  createModal,
  closeModal,
  openModal
} from "../uiKit.js";

import {
  createFilterButtonGroup,
  createSearchRow,
  createDefListContainer
} from "../../utils/listUtils.js";

import {
  loadItemDefinitions,
  deleteItemDefinition,
  subscribeItemDefinitions
} from "../../services/itemDefinitionsService.js";

import { createItemDefinitionForm } from "../forms/itemDefinitionForm.js";

/**
 * Initializes the “Manage Items” modal.
 * Returns an object with `open()` and `refresh()` methods.
 */
export function initItemDefinitionsModal(db) {
  const { modal, content } = createModal({
    id: "item-definitions-modal",
    title: "Manage Items",
    size: "large",
    backdrop: true,
    draggable: false,
    withDivider: true,
    onClose: () => closeModal(modal)
  });

  const header = content.querySelector(".modal-header");

  const rarityOrder = {
    legendary: 5,
    epic: 4,
    rare: 3,
    uncommon: 2,
    common: 1,
    "": 0
  };

  const sortFns = {
    "filter-name":        (a, b) => a.name.localeCompare(b.name),
    "filter-type":        (a, b) => a.itemType.localeCompare(b.itemType),
    "filter-rarity":      (a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity],
    "filter-description": (a, b) => a.description.localeCompare(b.description),
    "filter-quantity":    (a, b) => (parseInt(b.quantity) || 0) - (parseInt(a.quantity) || 0),
    "filter-price":       (a, b) => (parseFloat(b.value) || 0) - (parseFloat(a.value) || 0)
  };

  const { wrapper: filterWrapper } = createFilterButtonGroup([
    { id: "filter-name",        label: "N" },
    { id: "filter-type",        label: "T" },
    { id: "filter-rarity",      label: "R" },
    { id: "filter-description", label: "D" },
    { id: "filter-quantity",    label: "Qt" },
    { id: "filter-price",       label: "P" }
  ], () => renderFilteredList());
  header.appendChild(filterWrapper);

  const { row: searchRow, input: searchInput } = createSearchRow("def-search", "Search items…");
  header.appendChild(searchRow);
  searchInput.addEventListener("input", renderFilteredList);

  const listContainer = createDefListContainer("item-definitions-list");
  content.appendChild(listContainer);
  content.appendChild(document.createElement("hr"));

  const {
    form,
    populateForm,
    clearForm,
    getPayload
  } = createItemDefinitionForm(db, modal, async () => {
    await refreshDefinitions();
  });

  content.appendChild(form);

  let definitions = [];
  let editingId = null;

  async function refreshDefinitions() {
    definitions = await loadItemDefinitions(db);
    renderFilteredList();
  }

  function renderFilteredList() {
    let list = definitions.filter(d =>
      d.name.toLowerCase().includes(searchInput.value.trim().toLowerCase())
    );
    Object.keys(sortFns).forEach(id => {
      const btn = document.getElementById(id);
      if (btn?.classList.contains("toggled")) {
        const fn = sortFns[id];
        list = [...list].sort(fn);
      }
    });
    renderList(list);
  }

  function renderList(list) {
    listContainer.innerHTML = "";
    list.forEach(def => {
      const entry = document.createElement("div");
      entry.className = "item-def-entry";
      entry.innerHTML = `
        <strong>${def.name}</strong> (${def.rarity})<br/>
        Type: ${def.itemType} • Qty: ${def.quantity || "—"} • Value: ${def.value || "—"}
      `;
      entry.addEventListener("click", () => {
        editingId = def.id;
        populateForm(def);
        openModal(modal);
      });
      listContainer.appendChild(entry);
    });
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = getPayload();
    if (!payload) return;
    if (editingId) {
      payload.id = editingId;
      const { updateItemDefinition } = await import("../../services/itemDefinitionsService.js");
      await updateItemDefinition(db, payload);
    } else {
      const { saveItemDefinition } = await import("../../services/itemDefinitionsService.js");
      await saveItemDefinition(db, null, payload);
    }
    closeModal(modal);
    await refreshDefinitions();
  });

  const btnDelete = document.createElement("button");
  btnDelete.type = "button";
  btnDelete.className = "ui-button";
  btnDelete.textContent = "Delete";
  btnDelete.onclick = async () => {
    if (!editingId) return;
    await deleteItemDefinition(db, editingId);
    closeModal(modal);
    await refreshDefinitions();
  };
  form.querySelector(".field-row:last-child").appendChild(btnDelete);

  subscribeItemDefinitions(db, defs => {
    definitions = defs;
    renderFilteredList();
  });

  return {
    open: async () => {
      editingId = null;
      clearForm();
      await refreshDefinitions();
      openModal(modal);
    },
    refresh: refreshDefinitions
  };
}

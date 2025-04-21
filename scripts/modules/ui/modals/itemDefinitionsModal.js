// @version: 21
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
  saveItemDefinition,
  updateItemDefinition,
  deleteItemDefinition,
  subscribeItemDefinitions
} from "../../services/itemDefinitionsService.js";

import { createItemDefinitionForm } from "../forms/itemDefinitionForm.js";

import { createTopAlignedFieldRow } from "../../utils/formUtils.js";

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

  let activeSorts = new Set();

  const { wrapper: filterWrapper } = createFilterButtonGroup(
    [
      { id: "filter-name",        label: "N"  },
      { id: "filter-type",        label: "T"  },
      { id: "filter-rarity",      label: "R"  },
      { id: "filter-description", label: "D"  },
      { id: "filter-quantity",    label: "Qt" },
      { id: "filter-price",       label: "P"  }
    ],
    (btnId, isToggled) => {
      if (isToggled) activeSorts.add(btnId);
      else activeSorts.delete(btnId);
      renderFilteredList();
    }
  );
  header.appendChild(filterWrapper);

  const { row: searchRow, input: searchInput } =
    createSearchRow("def-search", "Search items…");
  header.appendChild(searchRow);
  searchInput.addEventListener("input", () => renderFilteredList());

  const listContainer = createDefListContainer("item-definitions-list");
  content.appendChild(listContainer);
  content.appendChild(document.createElement("hr"));

  let definitions = [];

  const formApi = createItemDefinitionForm({
    onCancel: () => closeModal(modal),
    onDelete: async (idToDelete) => {
      await deleteItemDefinition(db, idToDelete);
      await refreshDefinitions();
    },
    onSubmit: async (payload) => {
      let saved;
      if (payload.id) {
        saved = await updateItemDefinition(db, String(payload.id), payload);
      } else {
        saved = await saveItemDefinition(db, null, payload);
      }

      const idx = definitions.findIndex(d => d.id === saved.id);
      if (idx !== -1) {
        definitions[idx] = saved;
      } else {
        definitions.unshift(saved);
      }

      renderFilteredList();
    }
  });

  formApi.form.classList.add("ui-scroll-float");
  content.appendChild(formApi.form);

  async function refreshDefinitions() {
    definitions = await loadItemDefinitions(db);
    renderFilteredList();
  }

  function renderFilteredList() {
    let list = definitions.filter(d =>
      d.name?.toLowerCase().includes(searchInput.value.trim().toLowerCase())
    );
    activeSorts.forEach(id => {
      const fn = sortFns[id];
      if (fn) list = [...list].sort(fn);
    });
    renderList(list);
  }

  function renderList(list) {
    listContainer.innerHTML = "";
    list.forEach(def => {
      const entry = document.createElement("div");
      entry.className = "item-def-entry";
      entry.innerHTML = `
        <strong>${def.name}</strong>
        <small>(${def.itemType || "—"}) – ${def.rarity || "—"}</small>
        <em>${def.description || ""}</em>
      `;
      entry.addEventListener("click", () => formApi.populate(def));
      listContainer.appendChild(entry);
    });
  }

  subscribeItemDefinitions(db, defs => {
    definitions = defs;
    renderFilteredList();
  });

  return {
    open: async () => {
      formApi.reset();
      await refreshDefinitions();
      openModal(modal);
    },
    refresh: refreshDefinitions
  };
}

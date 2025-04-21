// @version: 26
// @file: /scripts/modules/ui/modals/itemDefinitionsModal.js

// Modal creation utilities
import {
  createModal,
  closeModal,
  openModal
} from "../uiKit.js";

// List utilities for filters, search, and containers
import {
  createFilterButtonGroup,
  createSearchRow,
  createDefListContainer
} from "../../utils/listUtils.js";

// Firestore services for item definitions
import {
  loadItemDefinitions,
  saveItemDefinition,
  updateItemDefinition,
  deleteItemDefinition,
  subscribeItemDefinitions
} from "../../services/itemDefinitionsService.js";

// Form creation for item definition management
import { createItemDefinitionForm } from "../forms/itemDefinitionForm.js";

// Main modal initializer
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

  // Sorting order for rarity
  const rarityOrder = {
    legendary: 5,
    epic: 4,
    rare: 3,
    uncommon: 2,
    common: 1,
    "": 0
  };

  // Sort function definitions
  const sortFns = {
    "filter-name":        (a, b) => a.name.localeCompare(b.name),
    "filter-type":        (a, b) => a.itemType.localeCompare(b.itemType),
    "filter-rarity":      (a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity],
    "filter-description": (a, b) => a.description.localeCompare(b.description),
    "filter-quantity":    (a, b) => (parseInt(b.quantity) || 0) - (parseInt(a.quantity) || 0),
    "filter-price":       (a, b) => (parseFloat(b.value) || 0) - (parseFloat(a.value) || 0)
  };

  let activeSorts = new Set();

  // Filter buttons
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

  // Search bar
  const { row: searchRow, input: searchInput } = createSearchRow("def-search", "Search items…");
  header.appendChild(searchRow);
  searchInput.addEventListener("input", () => renderFilteredList());

  // List container
  const listContainer = createDefListContainer("item-definitions-list");
  content.appendChild(listContainer);
  content.appendChild(document.createElement("hr"));

  let definitions = [];

  // Form logic
  const formApi = createItemDefinitionForm({
    onCancel: () => formApi.reset(),
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

      // Reload all items after saving to get proper ID
      await refreshDefinitions();

      // Try exact match using returned ID
      let match = definitions.find(d => d.id === saved.id);

      // Fallback match (when ID isn't immediately returned)
      if (!match) {
        match = definitions.find(d =>
          d.name === payload.name &&
          d.description === payload.description &&
          d.itemType === payload.itemType
        );
      }

      if (match) {
        formApi.populate(match);
      } else {
        console.warn("[submit] Could not locate freshly saved item in refreshed list:", saved);
      }
    }
  }); // ← This closing brace was missing previously ❗

  formApi.form.classList.add("ui-scroll-float");
  content.appendChild(formApi.form);

  // Reload from Firestore
  async function refreshDefinitions() {
    definitions = await loadItemDefinitions(db);
    renderFilteredList();
  }

  // Search + sort logic
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

  // Render entry list
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
      entry.addEventListener("click", () => {
        if (def.id) {
          formApi.populate(def);
        } else {
          console.warn("[warn] Skipping entry with missing id:", def);
        }
      });
      listContainer.appendChild(entry);
    });
  }

  // Real-time listener
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

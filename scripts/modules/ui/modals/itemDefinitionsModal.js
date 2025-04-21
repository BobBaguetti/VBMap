// @version: 25
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

// Optional vertical label-row layout
import { createTopAlignedFieldRow } from "../../utils/formUtils.js";

// Main modal initializer
export function initItemDefinitionsModal(db) {
  // Create modal shell
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

  // For sorting rarity by logical order (not alphabetical)
  const rarityOrder = {
    legendary: 5,
    epic: 4,
    rare: 3,
    uncommon: 2,
    common: 1,
    "": 0
  };

  // Sorting functions for each filter toggle
  const sortFns = {
    "filter-name":        (a, b) => a.name.localeCompare(b.name),
    "filter-type":        (a, b) => a.itemType.localeCompare(b.itemType),
    "filter-rarity":      (a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity],
    "filter-description": (a, b) => a.description.localeCompare(b.description),
    "filter-quantity":    (a, b) => (parseInt(b.quantity) || 0) - (parseInt(a.quantity) || 0),
    "filter-price":       (a, b) => (parseFloat(b.value) || 0) - (parseFloat(a.value) || 0)
  };

  let activeSorts = new Set(); // Active filter buttons

  // Filter buttons (Name, Type, etc.)
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
      renderFilteredList(); // re-sort when toggles change
    }
  );
  header.appendChild(filterWrapper);

  // Search bar
  const { row: searchRow, input: searchInput } =
    createSearchRow("def-search", "Search items…");
  header.appendChild(searchRow);
  searchInput.addEventListener("input", () => renderFilteredList());

  // Entry list container
  const listContainer = createDefListContainer("item-definitions-list");
  content.appendChild(listContainer);
  content.appendChild(document.createElement("hr"));

  let definitions = []; // All loaded items

  // Initialize item definition form
  const formApi = createItemDefinitionForm({
    // Cancel switches back to Add mode (doesn't close modal)
    onCancel: () => formApi.reset(),

    // Delete an item and refresh list
    onDelete: async (idToDelete) => {
      await deleteItemDefinition(db, idToDelete);
      await refreshDefinitions();
    },

// Save or update an item, then repopulate form using refreshed list
onSubmit: async (payload) => {
  let saved;

  if (payload.id) {
    // Updating an existing item
    saved = await updateItemDefinition(db, String(payload.id), payload);
  } else {
    // Saving a new item — but ID might be missing from return value
    saved = await saveItemDefinition(db, null, payload);
  }

  // Refresh the full definitions list to ensure we have latest data (with ID)
  await refreshDefinitions();

  // Try to find the freshly saved item from refreshed list
  let match = definitions.find(d => d.id === saved.id);

  // If saved.id is null, fallback to matching key fields
  if (!match) {
    match = definitions.find(d =>
      d.name === payload.name &&
      d.description === payload.description &&
      d.itemType === payload.itemType
    );
  }

  // Populate the form if we found it
  if (match) {
    formApi.populate(match);
  } else {
    console.warn("[submit] Could not locate freshly saved item in refreshed list:", saved);
  }
}

  // Enable floating scrollbar on form
  formApi.form.classList.add("ui-scroll-float");
  content.appendChild(formApi.form);

  // Loads definitions from Firestore
  async function refreshDefinitions() {
    definitions = await loadItemDefinitions(db);
    renderFilteredList();
  }

  // Filter and sort item definitions
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

  // Render each item entry
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

  // Live updates from Firestore
  subscribeItemDefinitions(db, defs => {
    definitions = defs;
    renderFilteredList();
  });

  // Exposed API
  return {
    open: async () => {
      formApi.reset(); // Reset to Add mode
      await refreshDefinitions(); // Load data
      openModal(modal); // Show modal
    },
    refresh: refreshDefinitions
  };
}

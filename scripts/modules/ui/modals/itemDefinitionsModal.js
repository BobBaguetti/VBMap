// @version: 31
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
import { rarityColors, itemTypeColors } from "../../utils/colorPresets.js";
import { createIcon } from "../../utils/iconUtils.js";

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

  const { row: searchRow, input: searchInput } = createSearchRow("def-search", "Search items…");
  header.appendChild(searchRow);
  searchInput.addEventListener("input", () => renderFilteredList());

  const listContainer = createDefListContainer("item-definitions-list");
  content.appendChild(listContainer);
  content.appendChild(document.createElement("hr"));

  let definitions = [];

  const formApi = createItemDefinitionForm({
    onCancel: () => formApi.reset(),
    onDelete: async (idToDelete) => {
      await deleteItemDefinition(db, idToDelete);
      await refreshDefinitions();
    },
    onSubmit: async (payload) => {
      const shouldUpdateColor = (payload.id != null);
      if (shouldUpdateColor) {
        if (payload.rarity in rarityColors) {
          payload.rarityColor = rarityColors[payload.rarity];
          formApi.setFieldColor("rarity", rarityColors[payload.rarity]);
        }
        if (payload.itemType in itemTypeColors) {
          payload.itemTypeColor = itemTypeColors[payload.itemType];
          formApi.setFieldColor("itemType", itemTypeColors[payload.itemType]);
        }
      }

      if (payload.id) {
        await updateItemDefinition(db, String(payload.id), payload);
      } else {
        await saveItemDefinition(db, null, payload);
      }

      await refreshDefinitions();
      formApi.reset();
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

      const valueHtml = def.value
        ? `<div class="entry-value">${def.value} ${createIcon("coins", { inline: true })}</div>`
        : "";

      const quantityHtml = def.quantity
        ? `<div class="entry-quantity">x${def.quantity}</div>`
        : "";

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "entry-delete";
      deleteBtn.innerHTML = createIcon("trash") + " Delete";
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (def.id && confirm(`Are you sure you want to delete "${def.name}"?`)) {
          deleteItemDefinition(db, def.id).then(refreshDefinitions);
        }
      };

      entry.innerHTML = `
        <div class="entry-name">${def.name}</div>
        <div class="entry-meta">
          <span class="entry-type" style="color: ${def.itemTypeColor || "#bbb"}">${def.itemType || "—"}</span> –
          <span class="entry-rarity" style="color: ${def.rarityColor || "#bbb"}">${def.rarity || "—"}</span>
        </div>
        <div class="entry-description">${def.description || ""}</div>
        <div class="entry-details">
          ${valueHtml}
          ${quantityHtml}
        </div>
      `;
      entry.appendChild(deleteBtn);

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

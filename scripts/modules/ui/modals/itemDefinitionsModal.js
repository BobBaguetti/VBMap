// @version: 32
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

      const name = document.createElement("div");
      name.className = "entry-name";
      name.textContent = def.name;

      const meta = document.createElement("div");
      meta.className = "entry-meta";
      const typeSpan = document.createElement("span");
      typeSpan.className = "entry-type";
      typeSpan.textContent = def.itemType || "—";
      typeSpan.style.color = def.itemTypeColor || "#bbb";

      const raritySpan = document.createElement("span");
      raritySpan.className = "entry-rarity";
      raritySpan.textContent = def.rarity || "—";
      raritySpan.style.color = def.rarityColor || "#bbb";

      meta.append(typeSpan, " – ", raritySpan);

      const desc = document.createElement("div");
      desc.className = "entry-description";
      desc.textContent = def.description || "";

      const details = document.createElement("div");
      details.className = "entry-details";
      if (def.value) {
        const valueEl = document.createElement("div");
        valueEl.className = "entry-value";
        valueEl.innerHTML = `${def.value} ${createIcon("coins", { inline: true }).outerHTML}`;
        details.appendChild(valueEl);
      }
      if (def.quantity) {
        const qtyEl = document.createElement("div");
        qtyEl.className = "entry-quantity";
        qtyEl.textContent = `x${def.quantity}`;
        details.appendChild(qtyEl);
      }

      const btnDelete = document.createElement("button");
      btnDelete.className = "entry-delete";
      btnDelete.title = "Delete";
      btnDelete.innerHTML = createIcon("trash").outerHTML;
      btnDelete.onclick = (e) => {
        e.stopPropagation();
        if (def.id && confirm(`Are you sure you want to delete "${def.name}"?`)) {
          deleteItemDefinition(db, def.id).then(refreshDefinitions);
        }
      };

      entry.append(name, meta, desc, details, btnDelete);
      entry.addEventListener("click", () => def.id && formApi.populate(def));
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

// @version: 4
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
  const heading = header.querySelector("h2");

  // 🔽 Modal switcher popup for future modals (quests, NPCs)
  const switcherPopup = document.createElement("div");
  switcherPopup.className = "modal-switcher-popup";
  switcherPopup.style.display = "none";

  [
    { label: "Items",  action: () => {} },
    { label: "Quests", action: () => document.getElementById("manage-quest-definitions").click() },
  ].forEach(opt => {
    const option = document.createElement("div");
    option.className = "modal-switcher-option";
    option.textContent = opt.label;
    option.addEventListener("click", () => {
      switcherPopup.style.display = "none";
      opt.action();
    });
    switcherPopup.appendChild(option);
  });

  document.body.appendChild(switcherPopup);
  heading.style.cursor = "pointer";
  heading.addEventListener("click", (e) => {
    const rect = heading.getBoundingClientRect();
    switcherPopup.style.top = `${rect.bottom + window.scrollY + 4}px`;
    switcherPopup.style.left = `${rect.left + window.scrollX}px`;
    switcherPopup.style.display =
      switcherPopup.style.display === "none" ? "block" : "none";
  });
  document.addEventListener("click", (e) => {
    if (!switcherPopup.contains(e.target) && e.target !== heading) {
      switcherPopup.style.display = "none";
    }
  });

  const rarityOrder = {
    legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1, "": 0
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
      isToggled ? activeSorts.add(btnId) : activeSorts.delete(btnId);
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
    onSubmit: async (payload) => {
      payload._justUpdated = true;
      payload._updated = Date.now();
      if (payload.id) {
        await updateItemDefinition(db, String(payload.id), payload);
      } else {
        await saveItemDefinition(db, null, payload);
      }
      closeModal(modal);
      await refreshDefinitions();
    },
    onDelete: async (id, name) => {
      const confirmed = confirm(`Are you sure you want to delete "${name}"?`);
      if (!confirmed) return;

      await deleteItemDefinition(db, id);
      closeModal(modal);
      await refreshDefinitions();
    }
  });

  formApi.form.classList.add("ui-scroll-float");
  content.appendChild(formApi.form);

  // Initialize color pickers
  const pickrTargets = [
    formApi.fields.colorName,
    formApi.fields.colorRarity,
    formApi.fields.colorItemType,
    formApi.fields.colorDesc
  ];

  setTimeout(() => {
    pickrTargets.forEach(el => {
      const pickr = createPickr(`#${el.id}`);
      pickr.on('change', (color) => {
        el.style.backgroundColor = color.toRGBA().toString();
      });
    });
  }, 0);

  async function refreshDefinitions() {
    const newDefs = await loadItemDefinitions(db);
    const now = Date.now();
    definitions = newDefs.map(def => {
      const existing = definitions.find(d => d.id === def.id);
      return { ...def, _updated: existing?._updated || now };
    });
    renderFilteredList();
  }

  function renderFilteredList() {
    let list = definitions.filter(d =>
      d.name.toLowerCase().includes(searchInput.value.trim().toLowerCase())
    );

    if (activeSorts.size > 0) {
      activeSorts.forEach(id => {
        const fn = sortFns[id];
        if (fn) list = [...list].sort(fn);
      });
    } else {
      list = [...list].sort((a, b) => (b._updated || 0) - (a._updated || 0));
    }

    renderList(list);
  }

  function renderList(list) {
    listContainer.innerHTML = "";
    list.forEach(def => {
      const entry = document.createElement("div");
      entry.className = "item-def-entry";
  
      const rarityClass = def.rarity ? `rarity-${def.rarity.toLowerCase()}` : "";
  
      const value = parseFloat(def.value);
      const valueHTML = value ? `<span class="item-value">${value}</span>` : "";
  
      entry.innerHTML = `
        <div class="item-line">
          <strong>${def.name}</strong>
          <span class="item-type">${def.itemType || "Unknown"}</span> — 
          <span class="rarity ${rarityClass}">${def.rarity || "Unknown"}</span>
          ${value ? `<span class="item-value-wrap">${valueHTML}</span>` : ""}
        </div>
        <div class="item-description">${def.description || ""}</div>
      `;

      if (value) {
        const valueWrap = entry.querySelector(".item-value-wrap");
        valueWrap.appendChild(createIcon("coin", { class: "gold-icon" }));
      }

      if (def._justUpdated) {
        entry.classList.add("recently-updated");
        setTimeout(() => entry.classList.remove("recently-updated"), 1400);
      }

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

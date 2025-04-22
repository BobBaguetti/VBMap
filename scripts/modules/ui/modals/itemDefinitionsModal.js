// @version: 39
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
import { createLayoutSwitcher } from "../uiKit.js";
import { createItemPreviewPanel } from "../preview/itemPreview.js";

export function initItemDefinitionsModal(db) {
  const { modal, content } = createModal({
    id: "item-definitions-modal",
    title: "Manage Items",
    size: "large",
    backdrop: true,
    draggable: false,
    withDivider: true,
    onClose: () => {
      closeModal(modal);
      previewPanel.classList.remove("visible");
      previewPanel.classList.add("hidden");
    }
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
  let currentLayout = "row";

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

  const layoutSwitcher = createLayoutSwitcher({
    available: ["row", "stacked", "gallery"],
    defaultView: "row",
    onChange: (layout) => {
      currentLayout = layout;
      renderFilteredList();
    }
  });
  header.appendChild(layoutSwitcher);

  const { row: searchRow, input: searchInput } = createSearchRow("def-search", "Search items…");
  header.appendChild(searchRow);
  searchInput.addEventListener("input", () => renderFilteredList());

  const listContainer = createDefListContainer("item-definitions-list");

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

  const previewPanel = document.createElement("div");
  document.body.appendChild(previewPanel);
  const previewApi = createItemPreviewPanel(previewPanel);

  formApi.form.addEventListener("input", () => {
    const data = formApi.getCustom?.();
    if (data) {
      previewApi.setFromDefinition(data);
    }
  });

  const bodyWrap = document.createElement("div");
  bodyWrap.style.display = "flex";
  bodyWrap.style.flexDirection = "column";
  bodyWrap.style.flex = "1 1 auto";
  bodyWrap.style.minHeight = 0;

  bodyWrap.appendChild(listContainer);
  bodyWrap.appendChild(document.createElement("hr"));
  bodyWrap.appendChild(formApi.form);

  content.appendChild(bodyWrap);

  function renderFilteredList() {
    listContainer.innerHTML = "";
    listContainer.className = `def-list ui-scroll-float layout-${currentLayout}`;

    definitions
      .filter(d => d.name?.toLowerCase().includes(searchInput.value.trim().toLowerCase()))
      .sort((a, b) => {
        for (let id of activeSorts) {
          const fn = sortFns[id];
          if (fn) return fn(a, b);
        }
        return 0;
      })
      .forEach(def => {
        const entry = document.createElement("div");
        entry.className = `item-def-entry layout-${currentLayout}`;

        const valueHtml = def.value
          ? `<div class="entry-value">${def.value} ${createIcon("coins", { inline: true }).outerHTML}</div>`
          : "";

        const quantityHtml = def.quantity
          ? `<div class="entry-quantity">x${def.quantity}</div>`
          : "";

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "entry-delete ui-button-delete";
        deleteBtn.title = "Delete this item";
        deleteBtn.appendChild(createIcon("trash"));
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          if (def.id && confirm(`Are you sure you want to delete \"${def.name}\"?`)) {
            deleteItemDefinition(db, def.id).then(refreshDefinitions);
          }
        };

        entry.innerHTML = `
          <div class="entry-name">${def.name}</div>
          <div class="entry-meta">
            <span class="entry-type" style="color: ${def.itemTypeColor || "#bbb"}">${def.itemType || "—"}</span> –
            <span class="entry-rarity" style="color: ${def.rarityColor || "#bbb"}">${def.rarity?.toUpperCase() || "—"}</span>
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
            previewPanel.classList.remove("hidden");
            previewPanel.classList.add("visible");
            previewApi.setFromDefinition(def);
          }
        });

        listContainer.appendChild(entry);
      });
  }

  async function refreshDefinitions() {
    definitions = await loadItemDefinitions(db);
    renderFilteredList();
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

      const modalRect = modal.querySelector(".modal-content")?.getBoundingClientRect();
      const previewRect = previewPanel.getBoundingClientRect();
      if (modalRect) {
        previewPanel.style.left = `${modalRect.right + 30}px`;
        previewPanel.style.top = `${modalRect.top + (modalRect.height / 2) - (previewRect.height / 2)}px`;
        previewPanel.style.position = "absolute";
      }

      previewPanel.classList.remove("hidden");
      previewPanel.classList.add("visible");
    },
    refresh: refreshDefinitions
  };
}

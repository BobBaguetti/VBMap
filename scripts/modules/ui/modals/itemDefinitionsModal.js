// @file: /scripts/modules/ui/modals/itemDefinitionsModal.js
// @version: 51 — modal creation deferred until open()

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
  // Deferred variables
  let modal, content, header;
  let filterWrapper, layoutSwitcher, searchInput;
  let listContainer, formApi, previewPanel, previewApi, listApi;
  let definitions = [];
  let activeSorts = new Set();
  let currentLayout = "row";

  // Helper: render the filtered list
  function renderFilteredList() {
    listContainer.innerHTML = "";
    listContainer.className = `def-list ui-scroll-float layout-${currentLayout}`;

    definitions
      .filter(d =>
        d.name.toLowerCase().includes((searchInput.value || "").trim().toLowerCase())
      )
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
        deleteBtn.title = `Delete "${def.name}"`;
        deleteBtn.appendChild(createIcon("trash"));
        deleteBtn.onclick = e => {
          e.stopPropagation();
          if (def.id && confirm(`Delete "${def.name}"?`)) {
            deleteItemDefinition(db, def.id).then(refreshDefinitions);
          }
        };

        entry.innerHTML = `
          <div class="entry-name">${def.name}</div>
          <div class="entry-meta">
            <span class="entry-type" style="color: ${def.itemTypeColor || "#bbb"}">
              ${def.itemType || "—"}
            </span> –
            <span class="entry-rarity" style="color: ${def.rarityColor || "#bbb"}">
              ${def.rarity?.toUpperCase() || "—"}
            </span>
          </div>
          <div class="entry-description">${def.description || ""}</div>
          <div class="entry-details">
            ${valueHtml}
            ${quantityHtml}
          </div>
        `;
        entry.appendChild(deleteBtn);

        entry.onclick = () => {
          if (def.id) {
            formApi.populate(def);
            previewApi.setFromDefinition(def);
            previewApi.show();
          }
        };

        listContainer.appendChild(entry);
      });
  }

  // Sort functions (copied from original)
  const rarityOrder = { legendary:5, epic:4, rare:3, uncommon:2, common:1, "":0 };
  const sortFns = {
    "filter-name":        (a, b) => a.name.localeCompare(b.name),
    "filter-type":        (a, b) => a.itemType.localeCompare(b.itemType),
    "filter-rarity":      (a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity],
    "filter-description": (a, b) => a.description.localeCompare(b.description),
    "filter-quantity":    (a, b) => (parseInt(b.quantity)||0) - (parseInt(a.quantity)||0),
    "filter-price":       (a, b) => (parseFloat(b.value)||0)   - (parseFloat(a.value)||0)
  };

  // Helper: refresh definitions (used by subscribe and open)
  async function refreshDefinitions() {
    definitions = await loadItemDefinitions(db);
    renderFilteredList();
  }

  // Build the entire modal the first time open() is called
  function ensureBuilt() {
    if (modal) return;

    // 1) Create modal shell
    const created = createModal({
      id:         "item-definitions-modal",
      title:      "Manage Items",
      size:       "large",
      backdrop:   true,
      draggable:  false,
      withDivider:true,
      onClose:    () => {
        closeModal(modal);
        previewApi.hide();
      }
    });
    modal   = created.modal;
    content = created.content;

    modal.classList.add("admin-only");
    header = content.querySelector(".modal-header");

    // 2) Header tools: filters
    const { wrapper } = createFilterButtonGroup(
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
        else           activeSorts.delete(btnId);
        renderFilteredList();
      }
    );
    filterWrapper = wrapper;
    header.appendChild(filterWrapper);

    // Layout switcher
    layoutSwitcher = createLayoutSwitcher({
      available:   ["row", "stacked", "gallery"],
      defaultView: "row",
      onChange:    (layout) => {
        currentLayout = layout;
        renderFilteredList();
      }
    });
    header.appendChild(layoutSwitcher);

    // Search row
    const { row: sr, input: si } = createSearchRow("def-search", "Search items…");
    searchInput = si;
    header.appendChild(sr);
    searchInput.addEventListener("input", renderFilteredList);

    // 3) Body: list + form
    listContainer = createDefListContainer("item-definitions-list");

    formApi = createItemDefinitionForm({
      onCancel: () => {
        formApi.reset();
        setTimeout(() => {
          const live = formApi.getCustom?.();
          if (live) previewApi.setFromDefinition(live);
        }, 0);
      },
      onDelete: async id => {
        await deleteItemDefinition(db, id);
        await refreshDefinitions();
        formApi.reset();
        setTimeout(() => {
          const live = formApi.getCustom?.();
          if (live) previewApi.setFromDefinition(live);
        }, 0);
      },
      onSubmit: async payload => {
        const updating = payload.id != null;
        if (updating) {
          if (payload.rarity in rarityColors) {
            payload.rarityColor = rarityColors[payload.rarity];
            formApi.setFieldColor("rarity", payload.rarityColor);
          }
          if (payload.itemType in itemTypeColors) {
            payload.itemTypeColor = itemTypeColors[payload.itemType];
            formApi.setFieldColor("itemType", payload.itemTypeColor);
          }
        }
        if (payload.id) await updateItemDefinition(db, String(payload.id), payload);
        else            await saveItemDefinition(db, null, payload);

        await refreshDefinitions();
        formApi.reset();
        setTimeout(() => {
          const live = formApi.getCustom?.();
          if (live) previewApi.setFromDefinition(live);
        }, 0);
      }
    });
    formApi.form.classList.add("ui-scroll-float");
    formApi.form.addEventListener("input", () => {
      const live = formApi.getCustom?.();
      if (live) {
        previewApi.setFromDefinition(live);
        previewApi.show();
      }
    });

    // Assemble body wrapper
    const bodyWrap = document.createElement("div");
    Object.assign(bodyWrap.style, {
      display:       "flex",
      flexDirection: "column",
      flex:          "1 1 auto",
      minHeight:     "0"
    });
    bodyWrap.appendChild(listContainer);
    bodyWrap.appendChild(document.createElement("hr"));
    bodyWrap.appendChild(formApi.form);
    content.appendChild(bodyWrap);

    // 4) Preview panel
    previewPanel = document.createElement("div");
    previewPanel.style.zIndex = 1101;
    document.body.appendChild(previewPanel);
    previewApi = createItemPreviewPanel(previewPanel);

    // 5) Real-time subscription
    subscribeItemDefinitions(db, defsList => {
      definitions = defsList;
      renderFilteredList();
    });
  }

  // Public API
  return {
    open: async () => {
      ensureBuilt();
      formApi.reset();
      await refreshDefinitions();
      openModal(modal);

      // Position preview next to modal
      const mc = modal.querySelector(".modal-content").getBoundingClientRect();
      const pr = previewPanel.getBoundingClientRect();
      previewPanel.style.position = "absolute";
      previewPanel.style.left = `${mc.right + 30}px`;
      previewPanel.style.top  = `${mc.top + mc.height/2 - pr.height/2}px`;

      setTimeout(() => {
        const live = formApi.getCustom?.();
        if (live) previewApi.setFromDefinition(live);
        previewApi.show();
      }, 0);
    },
    refresh: refreshDefinitions
  };
}

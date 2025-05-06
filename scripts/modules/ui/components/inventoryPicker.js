// @version: 1.1
// @file: /scripts/modules/ui/components/inventoryPicker.js

import {
  createModal,
  openModal,
  closeModal,
  createFormButtonRow
} from "./modalHelpers.js";

import { loadItemDefinitions } from "../../services/itemDefinitionsService.js";

/**
 * Opens a modal that lets the user search & multi-select item definitions.
 * Resolves with the (possibly empty) array of selected IDs.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {{
 *   selectedIds?: string[],
 *   title?:       string
 * }} [opts]
 * @returns {Promise<string[]>}
 */
export async function openInventoryPicker(db, {
  selectedIds = [],
  title       = "Select Items"
} = {}) {
  if (!openInventoryPicker._allItems) {
    openInventoryPicker._allItems = await loadItemDefinitions(db);
  }
  const allItems = openInventoryPicker._allItems;

  // build modal once
  if (!openInventoryPicker._modal) {
    const { modal, header, content } = createModal({
      id:       "inventory-picker-modal",
      title,
      size:     "small",
      backdrop: true,
      withDivider: true,
      onClose: () => closeModal(modal)
    });
    openInventoryPicker._modal   = modal;
    openInventoryPicker._header  = header;
    openInventoryPicker._content = content;

    // search box
    const search = document.createElement("input");
    search.type = "text";
    search.placeholder = "Search…";
    header.appendChild(search);
    openInventoryPicker._search = search;

    // list container
    const list = document.createElement("div");
    Object.assign(list.style, {
      maxHeight: "200px",
      overflowY: "auto",
      margin: "8px 0"
    });
    content.appendChild(list);
    openInventoryPicker._list = list;

    // buttons
    const btnRow = createFormButtonRow(
      () => closeModal(modal),
      "Save",
      "Cancel"
    );
    content.appendChild(btnRow);
    openInventoryPicker._saveBtn = btnRow.querySelector('button[type="submit"]');

    // filter logic
    openInventoryPicker._filter = () => {
      const q = search.value.toLowerCase();
      list.childNodes.forEach(row => {
        const txt = row.querySelector("label").textContent.toLowerCase();
        row.style.display = txt.includes(q) ? "" : "none";
      });
    };
    search.addEventListener("input", openInventoryPicker._filter);
  }

  // populate for this run
  const { _modal: modal, _header: header, _list: list, _search: search, _filter: filter, _saveBtn: saveBtn } = openInventoryPicker;
  header.querySelector("h2").textContent = title;
  list.innerHTML = "";

  allItems.forEach(item => {
    const row = document.createElement("div");
    Object.assign(row.style, { display:"flex", alignItems:"center", padding:"4px 0" });

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = item.id;
    cb.checked = selectedIds.includes(item.id);
    cb.style.marginRight = "8px";

    const lbl = document.createElement("label");
    lbl.textContent = item.name;

    row.append(cb, lbl);
    list.appendChild(row);
  });

  search.value = "";
  filter();

  return new Promise(resolve => {
    saveBtn.onclick = () => {
      const ids = Array.from(list.querySelectorAll("input:checked")).map(n => n.value);
      closeModal(modal);
      resolve(ids);
    };
    openModal(modal);
  });
}

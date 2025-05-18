// @file: src/shared/ui/components/listPicker.js
// @version: 1.3 — switched to createListPickerModal

import { createListPickerModal } from "../core/createListPickerModal.js";

/**
 * Opens a modal letting the user pick zero or more items.
 *
 * @param {object} opts
 * @param {string} opts.title            — modal title
 * @param {Array<object>} opts.items     — array of {id, name, …} objects
 * @param {Array<string>} [opts.selected] — array of item ids to pre-check
 * @param {string} [opts.labelKey="name"] — which property to show as the label
 * @returns {Promise<Array<string>>} resolves to the selected item ids when OK is clicked, rejects on Cancel
 */
export function pickItems({ title, items, selected = [], labelKey = "name" }) {
  // 1) Instantiate picker modal
  const { modal, slots, open, close } = createListPickerModal({
    id:          `picker-${Date.now()}`,
    title,
    onClose:     null
  });

  // 2) Add header search input
  const search = document.createElement("input");
  search.type        = "search";
  search.placeholder = "Search…";
  search.classList.add("ui-input");
  const header = modal.querySelector("header");
  header.appendChild(search);

  // 3) Container for list
  const listContainer = document.createElement("div");
  Object.assign(listContainer.style, {
    maxHeight: "200px",
    overflowY: "auto",
    margin:    "8px 0"
  });
  slots.body.appendChild(listContainer);

  let checkboxes = [];
  function renderList(filter = "") {
    listContainer.innerHTML = "";
    checkboxes = items
      .filter(it => it[labelKey].toLowerCase().includes(filter.toLowerCase()))
      .map(it => {
        const row = document.createElement("div");
        Object.assign(row.style, { display: "flex", alignItems: "center", padding: "4px 0" });
        const cb = document.createElement("input");
        cb.type        = "checkbox";
        cb.value       = it.id;
        cb.checked     = selected.includes(it.id);
        cb.style.marginRight = "8px";
        const lbl = document.createElement("label");
        lbl.textContent = it[labelKey];
        row.append(cb, lbl);
        listContainer.appendChild(row);
        return cb;
      });
  }
  renderList();

  search.addEventListener("input", () => renderList(search.value));

  // 4) Buttons row
  const btnRow = document.createElement("div");
  btnRow.style.textAlign = "right";
  slots.body.appendChild(btnRow);

  const btnCancel = document.createElement("button");
  btnCancel.type      = "button";
  btnCancel.className = "ui-button";
  btnCancel.textContent = "Cancel";
  btnCancel.onclick = () => {
    close();
    pickerReject();
  };

  const btnOk = document.createElement("button");
  btnOk.type      = "button";
  btnOk.className = "ui-button";
  btnOk.textContent = "OK";
  btnOk.onclick = () => {
    close();
    const picked = checkboxes.filter(cb => cb.checked).map(cb => cb.value);
    pickerResolve(picked);
  };

  btnRow.append(btnCancel, btnOk);

  // 5) Return promise
  let pickerResolve, pickerReject;
  const promise = new Promise((resolve, reject) => {
    pickerResolve = resolve;
    pickerReject  = reject;
  });

  // 6) Open modal
  open();

  return promise;
}

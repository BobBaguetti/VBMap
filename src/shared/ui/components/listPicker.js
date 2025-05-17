// @file: src\shared\ui\components\listPicker.js
// @version: 1.0 — generic multi-select list picker

import { createModal, openModal, closeModal } from "../index.js";

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
  // build base modal
  const { modal, header, content } = createModal({
    id:          `picker-${Date.now()}`,
    title,
    size:        "small",
    backdrop:    true,
    withDivider: true
  });

  // search bar
  const search = document.createElement("input");
  search.type        = "search";
  search.placeholder = "Search…";
  search.classList.add("ui-input");
  header.appendChild(search);

  // container for checkbox list
  const listContainer = document.createElement("div");
  Object.assign(listContainer.style, {
    maxHeight: "200px",
    overflowY: "auto",
    margin:    "8px 0"
  });
  content.appendChild(listContainer);

  let checkboxes = [];

  // render function
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

  // buttons row
  const btnRow = document.createElement("div");
  btnRow.style.textAlign = "right";

  const btnCancel = document.createElement("button");
  btnCancel.type        = "button";
  btnCancel.className   = "ui-button";
  btnCancel.textContent = "Cancel";

  const btnOk = document.createElement("button");
  btnOk.type        = "button";
  btnOk.className   = "ui-button";
  btnOk.textContent = "OK";

  btnRow.append(btnCancel, btnOk);
  content.appendChild(btnRow);

  // promise logic
  let resolvePick, rejectPick;
  const promise = new Promise((resolve, reject) => {
    resolvePick = resolve;
    rejectPick  = reject;
  });

  btnCancel.onclick = () => {
    closeModal(modal);
    rejectPick();
  };

  btnOk.onclick = () => {
    const picked = checkboxes.filter(cb => cb.checked).map(cb => cb.value);
    closeModal(modal);
    resolvePick(picked);
  };

  openModal(modal);
  return promise;
}

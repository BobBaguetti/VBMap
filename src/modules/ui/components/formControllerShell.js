// @file: src/modules/ui/components/formControllerShell.js
// @version: 1.2 — fixed import path for createIcon

import { createIcon } from "../../utils/iconUtils.js";

 /**
  * Builds the H3 subheading + floating-buttons row.
  *
  * @param {object} opts
  * @param {string} opts.title         — text for the <h3>
  * @param {boolean} [opts.hasFilter]  — whether to show the “Add to filters” checkbox
  * @param {function} opts.onFilter    — called when the filter checkbox toggles
  * @param {function} opts.onCancel
  * @param {function} opts.onDelete
  * @returns {{
  *   container: HTMLDivElement,     // the wrapper <div>
  *   subheading: HTMLHeadingElement,
  *   filterCheckbox?: HTMLInputElement,
  *   setDeleteVisible: (v:boolean)=>void
  * }}
  */
export function createFormControllerHeader({
  title, hasFilter = false, onFilter, onCancel, onDelete
}) {
  const wrap = document.createElement("div");
  wrap.style.display        = "flex";
  wrap.style.justifyContent = "space-between";
  wrap.style.alignItems     = "center";

  // title
  const h3 = document.createElement("h3");
  h3.textContent = title;
  wrap.appendChild(h3);

  // optional filter checkbox
  let filterCheckbox;
  if (hasFilter) {
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.id   = "fld-add-to-filters";
    chk.addEventListener("change", () => onFilter(chk.checked));
    const lbl = document.createElement("label");
    lbl.htmlFor    = chk.id;
    lbl.textContent = "Add to filters";
    const fc = document.createElement("div");
    fc.style.display    = "flex";
    fc.style.alignItems = "center";
    fc.style.marginLeft = "1rem";
    fc.append(lbl, chk);
    wrap.appendChild(fc);
    filterCheckbox = chk;
  }

  // buttons
  const btnRow = document.createElement("div");
  btnRow.className = "floating-buttons";

  const btnSave = document.createElement("button");
  btnSave.type      = "submit";
  btnSave.className = "ui-button";
  btnSave.textContent = "Save";

  const btnClear = document.createElement("button");
  btnClear.type      = "button";
  btnClear.className = "ui-button";
  btnClear.textContent = "Clear";
  btnClear.onclick   = onCancel;

  const btnDelete = document.createElement("button");
  btnDelete.type        = "button";
  btnDelete.className   = "ui-button-delete";
  btnDelete.title       = "Delete";
  btnDelete.style.width = "28px";
  btnDelete.style.height= "28px";
  btnDelete.appendChild(createIcon("trash"));
  btnDelete.onclick     = () => onDelete();
  btnDelete.hidden      = true;

  btnRow.append(btnSave, btnClear, btnDelete);
  wrap.appendChild(btnRow);

  return {
    container: wrap,
    subheading: h3,
    filterCheckbox,
    setDeleteVisible: v => { btnDelete.hidden = !v; }
  };
}
 
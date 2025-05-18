// @file: src/modules/ui/components/formControllerShell.js
// @version: 1.4 — use CSS classes, rename filter label, support addTitle/editTitle

import { createIcon } from "../../utils/iconUtils.js";

/**
 * Builds the H3 subheading + floating-buttons row.
 *
 * @param {object} opts
 * @param {string} opts.title         — text for the <h3>
 * @param {boolean} [opts.hasFilter]  — whether to show the “Show in filters” checkbox
 * @param {string} [opts.addTitle]    — subheading text when adding
 * @param {string} [opts.editTitle]   — subheading text when editing
 * @param {function} opts.onFilter    — called(e) when the filter checkbox toggles
 * @param {function} opts.onCancel
 * @param {function} opts.onDelete
 * @returns {{
 *   container: HTMLDivElement,
 *   subheading: HTMLHeadingElement,
 *   filterCheckbox?: HTMLInputElement,
 *   setDeleteVisible: (v:boolean)=>void
 * }}
 */
export function createFormControllerHeader({
  title,
  hasFilter = false,
  addTitle = `Add ${title}`,
  editTitle = `Edit ${title}`,
  onFilter,
  onCancel,
  onDelete
}) {
  // Wrapper uses your CSS class for layout
  const wrap = document.createElement("div");
  wrap.className = "modal-subheader";       // pinned by layout.css
  wrap.classList.add("form-controller-header");

  // Title
  const h3 = document.createElement("h3");
  h3.textContent = addTitle;
  wrap.appendChild(h3);

  // Filter checkbox
  let filterCheckbox;
  if (hasFilter) {
    const fc = document.createElement("div");
    fc.className = "form-filter-toggle";
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.id   = "fld-show-in-filters";
    chk.addEventListener("change", () => onFilter(chk.checked));
    const lbl = document.createElement("label");
    lbl.htmlFor = chk.id;
    lbl.textContent = "Show in filters";
    fc.append(lbl, chk);
    wrap.appendChild(fc);
    filterCheckbox = chk;
  }

  // Buttons row, using your scoped CSS
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
  btnDelete.type      = "button";
  btnDelete.className = "btn-delete";
  btnDelete.title     = "Delete";
  btnDelete.appendChild(createIcon("trash"));
  btnDelete.onclick   = onDelete;
  btnDelete.hidden    = true;

  btnRow.append(btnSave, btnClear, btnDelete);
  wrap.append(btnRow);

  return {
    container: wrap,
    subheading: h3,
    filterCheckbox,
    setDeleteVisible: v => {
      btnDelete.hidden = !v;
      h3.textContent   = v ? editTitle : addTitle;
    }
  };
}

/**
 * Wires form submission and live‐preview on input events.
 */
export function wireFormEvents(form, getCustom, onSubmit, onFieldChange) {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    await onSubmit?.(getCustom());
  });
  form.addEventListener("input", () => {
    onFieldChange?.(getCustom());
  });
}

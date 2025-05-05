// =========================================================
// VBMap • Sub‑Header Builder
// ---------------------------------------------------------
// @file:    /scripts/modules/ui/components/subHeaderBuilder.js
// @version: 1.0  (2025‑05‑08)
// ---------------------------------------------------------
// Creates the little header row that appears above every
// definition form:  «Add … / Edit …»   [Save] [Clear] [🗑]
// Call it once inside a form controller; keep the handle to
// easily switch between “add” & “edit” modes.
// =========================================================

import { createIcon } from "../../utils/iconUtils.js";

/**
 * @param {HTMLFormElement} form
 * @param {{
 *   titleAdd:  string,
 *   titleEdit: string,
 *   onClear:   Function,
 *   onDelete?: Function        // omit for no delete button
 * }} opts
 * @returns {{
 *   setMode(mode:"add"|"edit"): void,
 *   getSaveButton(): HTMLButtonElement
 * }}
 */
export function buildSubHeader(form, opts) {
  const { titleAdd, titleEdit, onClear, onDelete } = opts;

  /* container */
  const bar = document.createElement("div");
  bar.className = "form-subheader";
  Object.assign(bar.style, { display: "flex", alignItems: "center" });

  /* title span */
  const title = document.createElement("span");
  title.className = "subheader-title";
  bar.appendChild(title);

  /* right‑aligned button row */
  const btnRow = document.createElement("span");
  Object.assign(btnRow.style, { display: "flex", gap: "6px", marginLeft: "auto" });

  /* save / create */
  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.className = "ui-button-primary";
  btnRow.appendChild(saveBtn);

  /* clear / cancel */
  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "ui-button";
  clearBtn.textContent = "Clear";
  clearBtn.onclick = () => onClear?.();
  btnRow.appendChild(clearBtn);

  /* delete (optional) */
  let deleteBtn = null;
  if (onDelete) {
    deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "ui-button-delete";
    deleteBtn.appendChild(createIcon("trash"));
    deleteBtn.onclick = () => onDelete();
    btnRow.appendChild(deleteBtn);
  }

  bar.appendChild(btnRow);
  form.prepend(bar);

  /* mode switcher */
  function setMode(mode) {
    const add = mode === "add";
    title.textContent = add ? titleAdd  : titleEdit;
    saveBtn.textContent = add ? "Create" : "Save";
    deleteBtn && (deleteBtn.style.display = add ? "none" : "");
  }
  setMode("add");

  return { setMode, getSaveButton: () => saveBtn };
}

// @file: /scripts/modules/ui/components/formButtonRow.js
// @version: 1.1 - integrated defaultFormButtonLabels from modalDefaults

import { defaultFormButtonLabels } from "./modalDefaults.js";

/**
 * Standard row containing a Save (submit) button and a Cancel button.
 *
 * @param {() => void} onCancel   – callback when Cancel is clicked
 * @param {string} [saveText]     – label for Save button (defaults to configured label)
 * @param {string} [cancelText]   – label for Cancel button (defaults to configured label)
 * @returns {HTMLElement}  – the row element
 */
export function createFormButtonRow(
  onCancel,
  saveText = defaultFormButtonLabels.save,
  cancelText = defaultFormButtonLabels.cancel
) {
  const row = document.createElement("div");
  row.className = "field-row";
  row.style.justifyContent = "center";
  row.style.marginTop = "10px";

  const btnSave = document.createElement("button");
  btnSave.type = "submit";
  btnSave.className = "ui-button";
  btnSave.textContent = saveText;

  const btnCancel = document.createElement("button");
  btnCancel.type = "button";
  btnCancel.className = "ui-button";
  btnCancel.textContent = cancelText;
  btnCancel.onclick = onCancel;

  row.append(btnSave, btnCancel);
  return row;
}

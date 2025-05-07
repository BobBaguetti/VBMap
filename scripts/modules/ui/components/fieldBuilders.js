// @file: /scripts/modules/ui/components/fieldBuilders.js
// @version: 2.0 – removed legacy swatches; only use createColorPreview

import { createIcon }           from "../../utils/iconUtils.js";
import { createColorPreview }   from "./colorPreview.js";

/**
 * Build a text or number field row.
 */
export function createTextField(key, labelText, type = "text") {
  const row = document.createElement("div");
  row.className = "field-row";

  const label = document.createElement("label");
  label.htmlFor = key;
  label.textContent = labelText;

  const input = document.createElement("input");
  input.type = type;
  input.id   = key;
  input.name = key;
  input.className = "ui-input";

  row.append(label, input);
  return { row, input };
}

/**
 * Build a select/dropdown field row.
 */
export function createDropdownField(key, labelText, options = []) {
  const row = document.createElement("div");
  row.className = "field-row";

  const label = document.createElement("label");
  label.htmlFor = key;
  label.textContent = labelText;

  const select = document.createElement("select");
  select.id   = key;
  select.name = key;
  select.className = "ui-input";

  options.forEach(opt => {
    const o = document.createElement("option");
    o.value   = opt.value;
    o.textContent = opt.label;
    select.appendChild(o);
  });

  row.append(label, select);
  return { row, select };
}

/**
 * Build a textarea field row.
 */
export function createTextAreaField(key, labelText) {
  const row = document.createElement("div");
  row.className = "field-row";

  const label = document.createElement("label");
  label.htmlFor = key;
  label.textContent = labelText;

  const textarea = document.createElement("textarea");
  textarea.id   = key;
  textarea.name = key;
  textarea.className = "ui-input";

  row.append(label, textarea);
  return { row, textarea };
}

/**
 * Build a checkbox field row.
 */
export function createCheckboxField(key, labelText) {
  const row = document.createElement("div");
  row.className = "field-row";

  const label = document.createElement("label");
  label.htmlFor = key;
  label.textContent = labelText;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id   = key;
  checkbox.name = key;
  checkbox.className = "ui-input";

  row.append(label, checkbox);
  return { row, checkbox };
}

/**
 * Build an image-URL input row.
 */
export function createImageField(key, labelText) {
  const row = document.createElement("div");
  row.className = "field-row";

  const label = document.createElement("label");
  label.htmlFor = key;
  label.textContent = labelText;

  const input = document.createElement("input");
  input.type = "url";
  input.id   = key;
  input.name = key;
  input.className = "ui-input";

  row.append(label, input);
  return { row, input };
}

/**
 * Build the form’s Save / Clear / (Delete) button row.
 */
export function createFormButtonRow(onCancel, saveText = "Save", cancelText = "Cancel") {
  const row = document.createElement("div");
  row.className = "form-button-row";
  row.style.marginTop = "12px";
  row.style.display = "flex";
  row.style.gap = "8px";
  row.style.justifyContent = "flex-end";

  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.textContent = saveText;
  saveBtn.className = "ui-button-primary";
  row.appendChild(saveBtn);

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = cancelText;
  cancelBtn.className = "ui-button";
  cancelBtn.onclick = onCancel;
  row.appendChild(cancelBtn);

  return row;
}

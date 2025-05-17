// @file: src\shared\ui\components\fieldKit.js
// @version: 1.4 — export chip‐list field helper

import { createPickr, disablePickr, getPickrHexColor } from "../forms/pickrAdapter.js";
import { createExtraInfoBlock } from "./extraInfoBlock.js";

export function createFieldRow(labelText, inputEl) {
  const row = document.createElement("div");
  row.className = "field-row";

  const label = document.createElement("label");
  // ensure one trailing colon
  label.textContent = labelText.endsWith(":")
    ? labelText
    : `${labelText}:`;

  row.append(label, inputEl);
  return row;
}

export function createColorButton(id) {
  const btn = document.createElement("div");
  btn.className = "color-btn color-swatch";
  btn.id = id;
  return btn;
}

export function createColorFieldRow(labelText, inputEl, colorId) {
  const row = document.createElement("div");
  row.className = "field-row";
  const label = document.createElement("label");
  label.textContent = labelText.endsWith(":")
    ? labelText
    : `${labelText}:`;
  const colorBtn = createColorButton(colorId);
  row.append(label, inputEl, colorBtn);
  return { row, inputEl, colorBtn };
}

export function createTextField(labelText, id) {
  const input = document.createElement("input");
  input.id = id;
  input.className = "ui-input";
  const { row, colorBtn } = createColorFieldRow(labelText, input, `${id}-color`);
  return { row, input, colorBtn };
}

export function createTextareaFieldWithColor(labelText, id) {
  const textarea = document.createElement("textarea");
  textarea.id = id;
  const { row, colorBtn } = createColorFieldRow(labelText, textarea, `${id}-color`);
  return { row, textarea, colorBtn };
}

export function createDropdownField(
  labelText,
  id,
  options = [],
  { showColor = true } = {}
) {
  const select = document.createElement("select");
  select.id = id;
  select.className = "ui-input";
  options.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    select.append(o);
  });
  const { row, inputEl: selectEl, colorBtn } = createColorFieldRow(
    labelText,
    select,
    `${id}-color`
  );
  if (!showColor) colorBtn.style.visibility = "hidden";
  return { row, select: selectEl, colorBtn };
}

export function createImageField(labelText, id) {
  const input = document.createElement("input");
  input.id = id;
  input.type = "text";
  const row = createFieldRow(labelText, input);
  return { row, input };
}

export function createFormButtonRow(onCancel, saveText = "Save", cancelText = "Cancel") {
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

/**
 * Create a top-aligned “Extra Info” field row, with optional <hr> dividers.
 *
 * @param {{ withDividers?: boolean }} opts
 * @returns {{ row: HTMLElement, extraInfo: ReturnType<typeof createExtraInfoBlock> }}
 */
export function createExtraInfoField({ withDividers = false } = {}) {
  const extraInfo = createExtraInfoBlock();
  const row = createFieldRow("Extra Info", extraInfo.block);
  row.style.alignItems = "flex-start";

  if (!withDividers) {
    return { row, extraInfo };
  }

  const container = document.createElement("div");
  const hrAbove   = document.createElement("hr");
  const hrBelow   = document.createElement("hr");
  container.append(hrAbove, row, hrBelow);
  return { row: container, extraInfo };
}

// Re-export block factory
export { createExtraInfoBlock } from "./extraInfoBlock.js";
// **New**: re-export the chip-list field helper
export { createChipListField } from "./chipListField.js";

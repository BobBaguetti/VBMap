// @version: 1
// @file: /scripts/modules/ui/forms/formFieldFactory.js

import {
  createTextField,
  createTextareaFieldWithColor,
  createDropdownField
} from "../../ui/uiKit.js";

/**
 * Creates a color-enabled text field.
 * @param {string} label - Field label
 * @param {string} id - Input ID
 * @returns {{ row: HTMLElement, input: HTMLInputElement, colorBtn: HTMLElement }}
 */
export function makeColorTextField(label, id) {
  return createTextField(label, id);
}

/**
 * Creates a color-enabled textarea.
 * @param {string} label - Field label
 * @param {string} id - Textarea ID
 * @returns {{ row: HTMLElement, textarea: HTMLTextAreaElement, colorBtn: HTMLElement }}
 */
export function makeColorTextarea(label, id) {
  return createTextareaFieldWithColor(label, id);
}

/**
 * Creates a color-enabled dropdown field.
 * @param {string} label - Field label
 * @param {string} id - Select element ID
 * @param {Array<{ value: string, label: string }>} options - Dropdown options
 * @returns {{ row: HTMLElement, select: HTMLSelectElement, colorBtn: HTMLElement }}
 */
export function makeColorDropdown(label, id, options = []) {
  return createDropdownField(label, id, options);
}

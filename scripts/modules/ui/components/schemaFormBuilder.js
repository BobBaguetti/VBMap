// @file: /scripts/modules/ui/components/schemaFormBuilder.js
// @version: 1.2 – guard against setting .type on textareas

import {
  createTextField,
  createDropdownField,
  createTextAreaField,
  createCheckboxField,
  createImageField,
  createFormButtonRow,
} from "./fieldBuilders.js";
import { createColorPreview } from "./colorPreview.js";
import { defaultFormButtonLabels } from "./modalDefaults.js";

/**
 * Creates a form controller from a schema definition.
 *
 * @param {Array<Object>} schema - form field definitions:
 *   { key, type, label, options?, pickr? }
 * @param {Object} callbacks
 * @param {() => void} callbacks.onCancel
 * @param {(id:string) => void} [callbacks.onDelete]
 * @param {(data:Object) => void} callbacks.onSubmit
 *
 * @returns {{
 *   form: HTMLFormElement,
 *   fields: Object<string,HTMLElement>,
 *   reset(): void,
 *   populate(def:Object): void,
 *   getCurrent(): Object,
 *   getSubHeaderElement(): HTMLElement,
 *   initPickrs(): void
 * }}
 */
export function createSchemaFormController(schema, { onCancel, onDelete, onSubmit }) {
  const form = document.createElement("form");
  form.className = "schema-form";

  const subHeader = document.createElement("div");
  subHeader.className = "form-subheader";

  const fields = {};

  // Build fields
  schema.forEach(fieldDef => {
    let row, input;

    switch (fieldDef.type) {
      case "text":
      case "number":
        ({ row, input } = createTextField(fieldDef.key, fieldDef.label, fieldDef.type));
        break;

      case "select":
        ({ row, select: input } = createDropdownField(fieldDef.key, fieldDef.label, fieldDef.options || []));
        break;

      case "textarea":
        ({ row, textarea: input } = createTextAreaField(fieldDef.key, fieldDef.label));
        break;

      case "checkbox":
        ({ row, checkbox: input } = createCheckboxField(fieldDef.key, fieldDef.label));
        break;

      case "image":
        ({ row, input } = createImageField(fieldDef.key, fieldDef.label));
        break;

      // Fallback: JSON textarea for list/multiselect
      case "list":
      case "multiselect":
        ({ row, textarea: input } = createTextAreaField(fieldDef.key, `${fieldDef.label} (JSON)`));
        break;

      default:
        console.warn(`Unknown field type "${fieldDef.type}"`);
        return;
    }

    // Color picker fields
    if (fieldDef.pickr) {
      // Only hide if this is an <input>
      if (input.tagName === "INPUT") {
        input.type = "hidden";
        input.name = fieldDef.key;
      }

      // Insert the color preview widget next to the label
      const previewEl = createColorPreview({
        initial: fieldDef.default || "#E5E6E8",
        onChange: hex => {
          // always write to input.value even if hidden
          input.value = hex;
          form.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
      const labelEl = row.querySelector("label");
      labelEl.appendChild(previewEl);
    }

    form.appendChild(row);
    fields[fieldDef.key] = input;
  });

  // Action buttons
  const btnRow = createFormButtonRow(onCancel, defaultFormButtonLabels.save, defaultFormButtonLabels.cancel);
  form.appendChild(btnRow);

  function reset() {
    form.reset();
  }

  function populate(def = {}) {
    schema.forEach(({ key, type }) => {
      const el = fields[key];
      if (!el) return;
      const val = def[key];
      if (type === "checkbox") el.checked = !!val;
      else if (type === "list" || type === "multiselect") el.value = JSON.stringify(val || []);
      else el.value = val != null ? val : "";
    });
  }

  function getCurrent() {
    const obj = {};
    schema.forEach(({ key, type }) => {
      const el = fields[key];
      if (!el) return;
      let value;
      if (type === "checkbox") value = el.checked;
      else if (type === "number") value = el.value === "" ? null : Number(el.value);
      else if (type === "list" || type === "multiselect") {
        try { value = JSON.parse(el.value); }
        catch { value = []; }
      } else value = el.value;
      obj[key] = value;
    });
    return obj;
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    onSubmit(getCurrent());
  });

  return {
    form,
    fields,
    reset,
    populate,
    getCurrent,
    getSubHeaderElement: () => subHeader,
    initPickrs: () => {}  // no-op now
  };
}

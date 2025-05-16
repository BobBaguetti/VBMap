// @file: src/modules/ui/forms/formBuilder.js
// @version: 1.0 — generic schema-driven form builder

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createExtraInfoField,
  createFormButtonRow
} from "../components/uiKit/fieldKit.js";

/**
 * Builds a <form> based on a schema.
 * @param {Object} schema  — map of fieldName → {type, label, ...}
 * @returns {{ form: HTMLFormElement, fields: Object, colorables: Object }}
 */
export function buildForm(schema) {
  const form = document.createElement("form");
  const fields = {};
  const colorables = {};

  for (const [key, cfg] of Object.entries(schema)) {
    let row, input, picker;
    switch (cfg.type) {
      case "text":
        ({ row, input, colorBtn: picker } =
          createTextField(cfg.label, `fld-${key}`));
        if (cfg.colorable) colorables[cfg.colorable] = picker;
        fields[key] = input;
        break;

      case "number":
        ({ row, input, colorBtn: picker } =
          createTextField(cfg.label, `fld-${key}`));
        input.type = "number";
        if (cfg.colorable) colorables[cfg.colorable] = picker;
        fields[key] = input;
        break;

      case "select":
        ({ row, select: input, colorBtn: picker } =
          createDropdownField(cfg.label, `fld-${key}`, 
            (cfg.options||[]).map(o => ({value:o,label:o})),
            { showColor: !!cfg.colorable }
          ));
        if (cfg.colorable) colorables[cfg.colorable] = picker;
        fields[key] = input;
        break;

      case "textarea":
        ({ row, textarea: input, colorBtn: picker } =
          createTextareaFieldWithColor(cfg.label, `fld-${key}`));
        if (cfg.colorable) colorables[cfg.colorable] = picker;
        fields[key] = input;
        break;

      case "imageUrl":
        ({ row, input } = createImageField(cfg.label, `fld-${key}`));
        fields[key] = input;
        break;

      case "extraInfo":
        ({ row, extraInfo: input } =
          createExtraInfoField(cfg));
        fields[key] = input;
        break;

      case "checkbox":
        row = document.createElement("label");
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = cfg.default ?? false;
        row.innerHTML = `<span>${cfg.label}</span>`;
        row.prepend(cb);
        fields[key] = cb;
        break;

      default:
        continue;
    }
    form.append(row);
  }

  return { form, fields, colorables };
}

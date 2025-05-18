// @file: src/modules/definition/forms/definitionFormBuilder.js
// @version: 1.4 — support withDividers for extraInfo fields

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createExtraInfoField,
  createChipListField
} from "../../../shared/ui/components/formFields.js";

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
          createDropdownField(
            cfg.label,
            `fld-${key}`,
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
        // here we now respect withDividers
        ({ row, extraInfo: input } =
          createExtraInfoField({ withDividers: !!cfg.withDividers }));
        fields[key] = input;
        break;

      case "chipList":
        ({ row, getItems: input, setItems: picker } =
          createChipListField(
            cfg.label,
            [],
            {
              items:      [],
              idKey:      cfg.idKey,
              labelKey:   cfg.labelKey,
              renderIcon: cfg.renderIcon
            }
          ));
        fields[key] = { get: input, set: picker };
        break;

      case "checkbox":
        row = document.createElement("label");
        const cb = document.createElement("input");
        cb.type    = "checkbox";
        cb.checked = cfg.default ?? false;
        row.textContent = cfg.label;
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

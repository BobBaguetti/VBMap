// @file: src/modules/definition/forms/definitionFormBuilder.js
// @version: 1.3 — ensure all rows get `field-row`, including checkboxes & extraInfo

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createExtraInfoBlock,
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
            (cfg.options || []).map(o => ({ value: o, label: o })),
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
        // use the raw block, but *always* wrap in a field-row
        const extraInfo = createExtraInfoBlock();
        const wrapper = document.createElement("div");
        wrapper.className = "field-row";
        const label = document.createElement("label");
        label.textContent = "Extra Info:";
        wrapper.append(label, extraInfo.block);
        row = wrapper;
        fields[key] = extraInfo;
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
        // ensure the row has our class
        row.classList.add("field-row");
        fields[key] = { get: input, set: picker };
        break;

      case "checkbox":
        {
          // wrap in DIV.field-row for consistent styling
          const cbWrapper = document.createElement("div");
          cbWrapper.className = "field-row";

          const cbLabel = document.createElement("label");
          const cb = document.createElement("input");
          cb.type    = "checkbox";
          cb.checked = cfg.default ?? false;
          cbLabel.append(cb, document.createTextNode(` ${cfg.label}`));

          cbWrapper.append(cbLabel);
          row = cbWrapper;
          fields[key] = cb;
        }
        break;

      default:
        continue;
    }

    form.append(row);
  }

  return { form, fields, colorables };
}

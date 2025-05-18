// @file: src/modules/definition/forms/definitionFormBuilder.js
// @version: 1.4 — remove withDividers (dividers now always in createExtraInfoField)

import { createFieldRow } from "../../../shared/ui/components/formFields.js";

/**
 * Builds a <form> based on a schema.
 * @param {Object} schema  — map of fieldName → {type, label, options?, colorable?, ...}
 * @returns {{ form: HTMLFormElement, fields: Object, colorables: Object }}
 */
export function buildForm(schema) {
  const form = document.createElement("form");
  const fields = {};
  const colorables = {};

  for (const [key, cfg] of Object.entries(schema)) {
    // prepare options for chipList/select
    const opts = {
      ...cfg,
      id: `fld-${key}`,
      options: cfg.options || []
    };

    const { row, input, colorBtn } = createFieldRow(opts);

    // track fields
    if (cfg.type === "chipList") {
      // chipList gives get/set interface on input/colorBtn
      fields[key] = { get: input.get, set: colorBtn };
    } else {
      fields[key] = input;
    }

    // track colorables by custom property name
    if (cfg.colorable && colorBtn) {
      colorables[cfg.colorable] = colorBtn;
    }

    form.append(row);
  }

  return { form, fields, colorables };
}

// @file: src/modules/definition/forms/definitionFormBuilder.js
// @version: 1.3.1 — support withDividers for extraInfo fields

import {
  createFieldRow,
  createExtraInfoField
} from "../../../shared/ui/components/formFields.js";

/**
 * Builds a <form> based on a schema.
 * @param {Object} schema  — map of fieldName → {type, label, options?, colorable?, withDividers?, …}
 * @returns {{ form: HTMLFormElement, fields: Object, colorables: Object }}
 */
export function buildForm(schema) {
  const form = document.createElement("form");
  const fields = {};
  const colorables = {};

  for (const [key, cfg] of Object.entries(schema)) {
    let row, input, colorBtn;

    if (cfg.type === "extraInfo") {
      // Use createExtraInfoField to respect withDividers flag
      ({ row, extraInfo: input } = createExtraInfoField({ withDividers: cfg.withDividers }));
      fields[key] = input;
      form.append(row);
      continue;
    }

    // All other field types use the generic field row
    const opts = {
      ...cfg,
      id: `fld-${key}`,
      options: cfg.options || []
    };
    ({ row, input, colorBtn } = createFieldRow(opts));

    // Track fields
    fields[key] = input;

    // Track color pickers
    if (cfg.colorable && colorBtn) {
      colorables[cfg.colorable] = colorBtn;
    }

    form.append(row);
  }

  return { form, fields, colorables };
}

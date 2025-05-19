// @file: src/modules/definition/forms/definitionFormBuilder.js
// @version: 1.5 — fix chipList API so controller.el.get() is defined

import { createFieldRow } from "../form/builder/fieldRow.js";

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
      type:         cfg.type,
      label:        cfg.label,
      id:           `fld-${key}`,
      options:      cfg.options || [],
      withDividers: cfg.withDividers || false,
      idKey:        cfg.idKey,
      labelKey:     cfg.labelKey,
      renderIcon:   cfg.renderIcon
    };

    const { row, input, colorBtn } = createFieldRow(opts);

    // track fields
    if (cfg.type === "chipList") {
      // input is the getItems function, so expose it as .get()
      fields[key] = { get: input, set: colorBtn };
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

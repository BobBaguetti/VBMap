// @file: src/modules/definition/form/builder/fieldRow.js
// @version: 2.2 — use native <input type="color"> instead of Pickr

import { createExtraInfoBlock } from "./extraInfoBlock.js";
import { createChipListField }  from "./chipListField.js";

/**
 * Creates one row in a form, wrapping the appropriate control
 * and color-input if needed.
 *
 * @param {Object} opts
 * @param {"text"|"number"|"select"|"textarea"|"imageUrl"|"extraInfo"|"chipList"|"checkbox"} opts.type
 * @param {string} opts.label     — row label
 * @param {string} [opts.id]      — id on the <input>/<select>/<textarea>
 * @param {string[]} [opts.options] — for select
 * @param {boolean} [opts.colorable] — show a color input
 * @param {boolean} [opts.withDividers] — extraInfo only
 * @param {string} [opts.idKey]   — chipList only
 * @param {string} [opts.labelKey]— chipList only
 * @param {Function} [opts.renderIcon] — chipList only
 *
 * @returns {{ row:HTMLElement, input:HTMLElement, colorInput?:HTMLInputElement }}
 */
export function createFieldRow({
  type, label, id, options = [],
  colorable = false, withDividers = false,
  idKey, labelKey, renderIcon
}) {
  const row = document.createElement("div");
  row.className = "form-row";

  // Label cell
  const labelEl = document.createElement("label");
  labelEl.textContent = label.endsWith(":")
    ? label
    : label + ":";
  row.append(labelEl);

  let input, colorInput;

  switch (type) {
    case "text":
    case "number":
      input = document.createElement("input");
      input.type = type;
      break;

    case "select":
      input = document.createElement("select");
      options.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        input.append(o);
      });
      break;

    case "textarea":
      input = document.createElement("textarea");
      break;

    case "imageUrl":
      input = document.createElement("input");
      input.type = "text";
      break;

    case "checkbox":
      const cbLabel = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id   = id;
      cbLabel.append(cb, document.createTextNode(` ${label}`));
      row.innerHTML = "";
      row.append(cbLabel);
      return { row, input: cb };

    case "extraInfo":
      if (withDividers) {
        const extra = createExtraInfoBlock();
        return { row: extra.block, input: extra };
      }
      const extra = createExtraInfoBlock();
      row.append(extra.block);
      return { row, input: extra };

    case "chipList":
      const { row: chipRow, getItems, setItems } =
        createChipListField(label, [], {
          items: [], idKey, labelKey, renderIcon
        });
      chipRow.classList.add("form-row");
      return { row: chipRow, input: getItems, colorInput: setItems };

    default:
      throw new Error(`Unknown field type: ${type}`);
  }

  input.id = id;
  input.className = "form-control";
  row.append(input);

  // Native color picker
  if (colorable) {
    colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.id   = `${id}-color`;
    colorInput.className = "color-input";
    row.append(colorInput);

    // Bubble input events for live-preview
    colorInput.addEventListener("input", () =>
      row.closest("form")?.dispatchEvent(new Event("input", { bubbles: true }))
    );
  }

  return { row, input, colorInput };
}

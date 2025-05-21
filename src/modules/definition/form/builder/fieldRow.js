// @file: src/modules/definition/form/builder/fieldRow.js
// @version: 2.3 — wire up extraInfo helper correctly so getLines()/setLines() work

import { createPickr }
  from "../controller/pickrAdapter.js";
import { createExtraInfoBlock } from "./extraInfoBlock.js";
import { createChipListField }  from "./chipListField.js";

/**
 * Creates one row in a form, wrapping the appropriate control
 * and color-swatch if needed.
 *
 * @param {Object} opts
 * @param {"text"|"number"|"select"|"textarea"|"imageUrl"|"extraInfo"|"chipList"|"checkbox"} opts.type
 * @param {string} opts.label     — row label
 * @param {string} [opts.id]      — id on the <input>/<select>/<textarea>
 * @param {string[]} [opts.options] — for select
 * @param {string} [opts.colorable] — name of the color field (e.g. "nameColor")
 * @param {string} [opts.idKey]   — chipList only
 * @param {string} [opts.labelKey]— chipList only
 * @param {Function} [opts.renderIcon] — chipList only
 *
 * @returns {{ row:HTMLElement, input:HTMLElement|Object, colorBtn?:HTMLElement }}
 */
export function createFieldRow({
  type,
  label,
  id,
  options = [],
  colorable = false,
  idKey,
  labelKey,
  renderIcon
}) {
  const row = document.createElement("div");
  row.className = "form-row";

  // label cell
  const labelEl = document.createElement("label");
  labelEl.textContent = label.endsWith(":") ? label : label + ":";
  row.append(labelEl);

  let input, colorBtn;

  switch (type) {
    case "text":
    case "number":
      input = document.createElement("input");
      input.type = type;
      input.id = id;
      input.className = "form-control";
      break;

    case "select":
      input = document.createElement("select");
      input.id = id;
      input.className = "form-control";
      options.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        input.append(o);
      });
      break;

    case "textarea":
      input = document.createElement("textarea");
      input.id = id;
      input.className = "form-control";
      break;

    case "imageUrl":
      input = document.createElement("input");
      input.type = "text";
      input.id = id;
      input.className = "form-control";
      break;

    case "extraInfo":
      // Create the extra-info helper (with getLines/setLines) and its block
      const extra = createExtraInfoBlock();
      input = extra;
      row.append(extra.block);
      // We return early so we don't go through the generic append logic
      return { row, input, colorBtn: null };

    case "chipList":
      const { row: tmpRow, getItems, setItems } = createChipListField(
        label,
        [],
        { items: [], idKey, labelKey, renderIcon }
      );
      tmpRow.classList.add("form-row");
      return { row: tmpRow, input: getItems, colorBtn: setItems };

    case "checkbox":
      const lbl = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = id;
      lbl.append(cb, document.createTextNode(` ${label}`));
      input = cb;
      row.innerHTML = "";
      row.append(lbl);
      break;

    default:
      throw new Error(`Unknown field type: ${type}`);
  }

  // Color swatch for non-extraInfo/chipList/checkbox fields
  if (colorable) {
    colorBtn = document.createElement("div");
    colorBtn.className = "color-btn";
    colorBtn.id = `${id}-color`;
    row.append(input, colorBtn);
  } else {
    row.append(input);
  }

  return { row, input, colorBtn };
}

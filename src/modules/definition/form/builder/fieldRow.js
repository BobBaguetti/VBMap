// @file: src/modules/definition/form/builder/fieldRow.js
// @version: 2.2 — pass `options` into chipList so picker isn’t empty

import { createPickr, disablePickr, getPickrHexColor }
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
 * @param {Array<any>} [opts.options] — for select OR chipList
 * @param {boolean} [opts.colorable] — show a color picker
 * @param {boolean} [opts.withDividers] — extraInfo only
 * @param {string} [opts.idKey]   — chipList only
 * @param {string} [opts.labelKey]— chipList only
 * @param {Function} [opts.renderIcon] — chipList only
 *
 * @returns {{ row:HTMLElement, input:HTMLElement, colorBtn?:HTMLElement }}
 */
export function createFieldRow({
  type,
  label,
  id,
  options = [],
  colorable = false,
  withDividers = false,
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
      const extra = createExtraInfoBlock();
      input = extra.block;
      if (withDividers) {
        const container = document.createElement("div");
        const hr1 = document.createElement("hr");
        const hr2 = document.createElement("hr");
        container.append(hr1, row, hr2);
        container.className = "form-row";
        row.append(input);
        return { row: container, input: extra };
      }
      break;

    case "chipList":
      // ─── UPDATED: pass `options` here so the picker can show items ───
      const { row: tmpRow, getItems, setItems } = createChipListField(
        label,
        [], // initialItems (will be overwritten on populate)
        {
          items:      options,   // ← use the array we injected into schema.lootPool.options
          idKey,
          labelKey,
          renderIcon
        }
      );
      tmpRow.classList.add("form-row");
      input = getItems;
      colorBtn = setItems;
      return { row: tmpRow, input, colorBtn };

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

  // Color swatch (for types except extraInfo, chipList, and checkbox)
  if (colorable && !["extraInfo", "chipList", "checkbox"].includes(type)) {
    colorBtn = document.createElement("div");
    colorBtn.className = "color-btn";
    colorBtn.id = `${id}-color`;
    row.append(input, colorBtn);
  } else {
    row.append(input);
  }

  return { row, input, colorBtn };
}

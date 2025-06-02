// @file: src/modules/definition/form/builder/fieldRow.js
// @version: 1.7 — forward cfg.items into createChipListField for chipList type

import { createChipListField } from "./chipListField.js";
import { createExtraInfoField } from "./extraInfoField.js";
import { createSelectField } from "./selectField.js";
import { createTextField }   from "./textField.js";
import { createTextareaField } from "./textareaField.js";
import { createImageField }  from "./imageField.js";

export function createFieldRow(cfg) {
  let row, input, colorBtn;

  switch (cfg.type) {
    case "text":
      {
        const { row: textRow, input: txtInput, colorBtn: txtColor } =
          createTextField(cfg.label, cfg.id);
        row      = textRow;
        input    = txtInput;
        colorBtn = txtColor;
      }
      break;

    case "textarea":
      {
        const { row: taRow, textarea: taInput, colorBtn: taColor } =
          createTextareaField(cfg.label, cfg.id);
        row      = taRow;
        input    = taInput;
        colorBtn = taColor;
      }
      break;

    case "select":
      {
        const { row: selRow, select: selInput, colorBtn: selColor } =
          createSelectField(cfg.label, cfg.id, cfg.options);
        row      = selRow;
        input    = selInput;
        colorBtn = selColor;
      }
      break;

    case "imageUrl":
      {
        const { row: imgRow, input: imgInput } =
          createImageField(cfg.label, cfg.id);
        row   = imgRow;
        input = imgInput;
      }
      break;

    case "chipList":
      {
        const {
          row: chipRow,
          get: getItems,
          set: setItems
        } = createChipListField(
          cfg.label,
          [],
          {
            items:      cfg.items || [],
            idKey:      cfg.idKey,
            labelKey:   cfg.labelKey,
            renderIcon: cfg.renderIcon,
            onChange:   cfg.onChange
          }
        );
        row      = chipRow;
        input    = getItems;
        colorBtn = setItems;
      }
      break;

    case "extraInfo":
      {
        const { row: infoRow, getLines, setLines } =
          createExtraInfoField(cfg.label, cfg.withDividers);
        row      = infoRow;
        input    = getLines;
        colorBtn = setLines;
      }
      break;

    default:
      {
        const { row: defRow, input: defInput, colorBtn: defColor } =
          createTextField(cfg.label, cfg.id);
        row      = defRow;
        input    = defInput;
        colorBtn = defColor;
      }
      break;
  }

  return { row, input, colorBtn };
}

// @file: scripts/modules/ui/modalSchemas/itemFields.js
// @version: 2
import { baseFields } from "./baseFields.js";

/**
 * Fields specific to Item definitions.
 */
export const itemFields = [
  ...baseFields,
  {
    name: "showInFilters",
    label: "Add to Filters",
    type: "checkbox",
    mapTo: "showInFilters",      // no-op (same name), but indicates boolean
  },
  {
    name: "quantity",
    label: "Quantity",
    type: "number",
    min: 0,
  },
  {
    name: "value",
    label: "Value",
    type: "number",
    step: 0.01,
  },
  {
    name: "iconUrl",
    label: "Icon URL",
    type: "text",
  },
  {
    name: "color",
    label: "Color",
    type: "text",
    colorPicker: true,           // auto-wire Pickr instance
  },
];

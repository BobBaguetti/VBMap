// @file: scripts/modules/ui/modalSchemas/chestFields.js
// @version: 2
import { baseFields } from "./baseFields.js";
import { loadItemDefinitions } from "../../services/itemDefinitionsService.js";

/**
 * Fields specific to Chest definitions.
 */
export const chestFields = [
  ...baseFields,
  {
    name: "capacity",
    label: "Capacity",
    type: "number",
    min: 0,
  },
  {
    name: "lootPool",
    label: "Loot Pool",
    type: "multiselect",
    optionsService: loadItemDefinitions,  // for populating select options
  },
];

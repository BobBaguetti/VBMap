// @file: /scripts/modules/ui/forms/builders/chestFormBuilder.js
// @version: 1.1 – styled with .field-row and universalForm

import { createFieldRow, createDropdownField } from "../universalForm.js";

/**
 * Builds the form layout for creating/editing a Chest Type.
 */
export function createChestForm() {
  const form = document.createElement("form");
  form.id = "chest-form";

  // Name
  const { row: rowName, input: fldName } =
    createFieldRow({ label: "Name", id: "fld-chest-name", type: "text" });
  // Icon URL
  const { row: rowIcon, input: fldIconUrl } =
    createFieldRow({ label: "Icon URL", id: "fld-chest-icon", type: "text" });

  // Loot Pool (multi-select of item IDs)
  const { row: rowLoot, select: fldLootPool } =
    createDropdownField({
      label: "Loot Pool",
      id:    "fld-chest-loot",
      multiple: true
    });

  // Max Display
  const { row: rowMax, input: fldMaxDisplay } =
    createFieldRow({
      label: "Max Display",
      id:    "fld-chest-max",
      type:  "number",
      attrs: { min: 1 }
    });

  // Assemble
  form.append(rowName, rowIcon, rowLoot, rowMax);

  return {
    form,
    fields: {
      fldName,
      fldIconUrl,
      fldLootPool,
      fldMaxDisplay
    }
  };
}

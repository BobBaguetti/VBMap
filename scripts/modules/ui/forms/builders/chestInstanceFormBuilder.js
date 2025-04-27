// @file: /scripts/modules/ui/forms/builders/chestInstanceFormBuilder.js
// @version: 1.1 – add .field-row classes and consistent styling

/**
 * Builds the form layout for creating/editing a Chest Instance.
 */
export function createChestInstanceForm() {
  const form = document.createElement("form");
  form.id = "chest-instance-form";

  // Chest Type selector
  const rowType = document.createElement("div");
  rowType.classList.add("field-row");
  const lblType = document.createElement("label");
  lblType.htmlFor = "fld-instance-type";
  lblType.textContent = "Chest Type";
  const fldType = document.createElement("select");
  fldType.id = "fld-instance-type";
  fldType.classList.add("ui-input");
  rowType.append(lblType, fldType);

  form.append(rowType);

  return {
    form,
    fields: {
      fldType
    }
  };
}

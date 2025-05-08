// @file: src/modules/ui/forms/builders/chestFormBuilder.js
// @version: 2.1 — use fieldKit for all fields

import {
  createFieldRow,
  createTextField,
  createDropdownField,
  createImageField,
  createExtraInfoBlock
} from "../../components/uiKit/fieldKit.js";
import { createLayoutSwitcher } from "../../components/uiKit/layoutSwitcher.js";

export function createChestForm() {
  const form = document.createElement("form");
  form.className = "chest-form";

  // Header rows are added by the controller shell, so here we start the body:
  const body = document.createElement("div");
  body.className = "form-body";

  // Name
  const { row: nameRow, input: nameInput } = createTextField("Name", "fld-chest-name");
  body.appendChild(nameRow);

  // Category & Size (side by side)
  const { row: categoryRow, select: categorySelect } = createDropdownField(
    "Category",
    "fld-chest-category",
    [
      { value: "Normal", label: "Normal" },
      { value: "Rare",     label: "Rare" },
      { value: "Legendary",label: "Legendary" }
    ],
    { showColor: false }
  );
  const { row: sizeRow, select: sizeSelect } = createDropdownField(
    "Size",
    "fld-chest-size",
    [
      { value: "Small",  label: "Small" },
      { value: "Medium", label: "Medium" },
      { value: "Large",  label: "Large" }
    ],
    { showColor: false }
  );
  const duo = document.createElement("div");
  duo.style.display = "flex";
  duo.style.gap     = "1rem";
  duo.append(categoryRow, sizeRow);
  body.appendChild(duo);

  // Loot Pool (with picker button)
  const lootLabel = document.createElement("label");
  lootLabel.textContent = "Loot Pool";
  const pickerBtn = document.createElement("button");
  pickerBtn.type = "button";
  pickerBtn.className = "ui-button";
  pickerBtn.textContent = "⚙️";
  pickerBtn.id = "fld-open-loot-picker";
  const chipContainer = document.createElement("div");
  chipContainer.className = "loot-pool-chips";
  const lootRow = document.createElement("div");
  lootRow.className = "field-row";
  lootRow.append(lootLabel, pickerBtn);
  body.appendChild(lootRow);
  body.appendChild(chipContainer);

  // Description
  const { row: descRow, textarea: descArea } = createTextField("Description", "fld-chest-desc");
  descArea.tagName = "TEXTAREA";
  body.appendChild(descRow);

  // Extra Info
  const extraInfo = createExtraInfoBlock();
  const extraRow = document.createElement("div");
  extraRow.className = "field-row";
  const extraLabel = document.createElement("label");
  extraLabel.textContent = "Extra Info";
  extraRow.append(extraLabel, extraInfo.block);
  body.appendChild(extraRow);

  // Image S & L
  const { row: imgSRow, input: imgSInput } = createImageField("Image S", "fld-chest-img-s");
  const { row: imgLRow, input: imgLInput } = createImageField("Image L", "fld-chest-img-l");
  body.appendChild(imgSRow);
  body.appendChild(imgLRow);

  // Wrap up
  form.appendChild(body);

  return {
    form,
    fields: {
      fldName:        nameInput,
      fldCategory:    categorySelect,
      fldSize:        sizeSelect,
      openLootPicker: pickerBtn,
      chipContainer,
      fldDesc:        descArea,
      extraInfo,
      fldImgS:        imgSInput,
      fldImgL:        imgLInput
    }
  };
}

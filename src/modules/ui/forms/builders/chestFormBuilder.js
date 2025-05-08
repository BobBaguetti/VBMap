// @file: src/modules/ui/forms/builders/chestFormBuilder.js
// @version: 2.2 — use textarea factory; fix extra-info row

import {
  createFieldRow,
  createTextField,
  createDropdownField,
  createImageField,
  createTextareaFieldWithColor,
  createExtraInfoBlock
} from "../../components/uiKit/fieldKit.js";

export function createChestForm() {
  const form = document.createElement("form");
  form.className = "chest-form";

  const body = document.createElement("div");
  body.className = "form-body";

  // — Name —
  const { row: nameRow, input: nameInput } = createTextField("Name", "fld-chest-name");
  body.appendChild(nameRow);

  // — Category & Size —
  const { row: categoryRow, select: categorySelect } = createDropdownField(
    "Category",
    "fld-chest-category",
    [{ value: "Normal", label: "Normal" }, { value: "Dragonvault", label: "Dragonvault" }],
    { showColor: false }
  );
  const { row: sizeRow, select: sizeSelect } = createDropdownField(
    "Size",
    "fld-chest-size",
    [{ value: "Small", label: "Small" }, { value: "Medium", label: "Medium" }, { value: "Large", label: "Large" }],
    { showColor: false }
  );
  const duo = document.createElement("div");
  duo.style.display = "flex";
  duo.style.gap = "1rem";
  duo.append(categoryRow, sizeRow);
  body.appendChild(duo);

  // — Loot Pool —
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

  // — Description —
  const {
    row: rowDesc,
    textarea: fldDesc,
    colorBtn: colorDesc
  } = createTextareaFieldWithColor("Description", "fld-chest-desc");
  // match existing ID/class conventions
  colorDesc.id = "fld-chest-desc-color";
  body.appendChild(rowDesc);

  // — Extra Info —
  const extraInfo = createExtraInfoBlock();
  const extraRow = createFieldRow("Extra Info", extraInfo.block);
  body.appendChild(extraRow);

  // — Image S & L —
  const { row: imgSRow, input: imgSInput } = createImageField("Image S", "fld-chest-img-s");
  const { row: imgLRow, input: imgLInput } = createImageField("Image L", "fld-chest-img-l");
  body.appendChild(imgSRow);
  body.appendChild(imgLRow);

  // assemble form
  form.appendChild(body);

  return {
    form,
    fields: {
      fldName:        nameInput,
      fldCategory:    categorySelect,
      fldSize:        sizeSelect,
      openLootPicker: pickerBtn,
      chipContainer,
      fldDesc,
      colorDesc,
      extraInfo,
      fldImgS:        imgSInput,
      fldImgL:        imgLInput
    }
  };
}

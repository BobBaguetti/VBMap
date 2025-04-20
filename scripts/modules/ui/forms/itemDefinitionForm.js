// @version: 6
// @file: /scripts/modules/ui/forms/itemDefinitionForm.js

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createExtraInfoBlock,
  createFormButtonRow
} from "../../ui/uiKit.js";

import { createPickr } from "../../ui/pickrManager.js";
import { createTopAlignedFieldRow } from "../../utils/formUtils.js";

export function createItemDefinitionForm({ onCancel, onSubmit }) {
  const form = document.createElement("form");
  form.id = "item-definition-form";

  const subheading = document.createElement("h3");
  subheading.id = "def-form-subheading";
  subheading.textContent = "Add / Edit Item";
  form.appendChild(subheading);

  const { row: rowName, input: fldName, colorBtn: colorName } = createTextField("Name:", "def-name");

  const { row: rowType, select: fldType, colorBtn: colorType } = createDropdownField("Item Type:", "def-type", [
    { value: "Crafting Material", label: "Crafting Material" },
    { value: "Special", label: "Special" },
    { value: "Consumable", label: "Consumable" },
    { value: "Quest", label: "Quest" }
  ]);

  const { row: rowRarity, select: fldRarity, colorBtn: colorRarity } = createDropdownField("Rarity:", "def-rarity", [
    { value: "", label: "Select Rarity" },
    { value: "common", label: "Common" },
    { value: "uncommon", label: "Uncommon" },
    { value: "rare", label: "Rare" },
    { value: "epic", label: "Epic" },
    { value: "legendary", label: "Legendary" }
  ]);

  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } =
    createTextareaFieldWithColor("Description:", "def-description");

  // ✅ Proper extra info layout and logic
  const { block: extraBlock, getLines, setLines } = createExtraInfoBlock();
  const rowExtra = createTopAlignedFieldRow("Extra Info:", extraBlock);

  const { row: rowValue, input: fldValue, colorBtn: colorValue } = createTextField("Value:", "def-value");
  const { row: rowQty, input: fldQty, colorBtn: colorQty } = createTextField("Quantity:", "def-quantity");

  const { row: rowImgS, input: fldImgS } = createImageField("Image S:", "def-image-small");
  const { row: rowImgL, input: fldImgL } = createImageField("Image L:", "def-image-big");

  const rowButtons = createFormButtonRow(onCancel);

  form.append(
    rowName,
    rowType,
    rowRarity,
    rowDesc,
    rowExtra,
    rowValue,
    rowQty,
    rowImgS,
    rowImgL,
    rowButtons
  );

  let editingId = null;

  function populate(def) {
    editingId = def.id || null;
    fldName.value = def.name || "";
    fldType.value = def.itemType || "";
    fldRarity.value = def.rarity || "";
    fldDesc.value = def.description || "";
    setLines(def.extraLines || [], false);
    fldValue.value = def.value || "";
    fldQty.value = def.quantity || "";
    fldImgS.value = def.imageSmall || "";
    fldImgL.value = def.imageBig || "";
    form.querySelector("#def-form-subheading").textContent = editingId ? "Edit Item" : "Add / Edit Item";
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const payload = {
      id: editingId,
      name: fldName.value.trim(),
      itemType: fldType.value,
      rarity: fldRarity.value,
      description: fldDesc.value.trim(),
      extraLines: getLines(),
      value: fldValue.value.trim(),
      quantity: fldQty.value.trim(),
      imageSmall: fldImgS.value.trim(),
      imageBig: fldImgL.value.trim()
    };
    onSubmit(payload);
  });

  const pickrTargets = [
    colorName, colorType, colorRarity,
    colorDesc, colorValue, colorQty
  ];
  setTimeout(() => {
    pickrTargets.forEach(el => {
      createPickr(`#${el.id}`);
    });
  }, 0);

  return {
    form,
    populate,
    reset: () => populate({})
  };
}

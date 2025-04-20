// @version: 10
// @file: /scripts/modules/ui/forms/itemDefinitionForm.js

import {
  createImageField,
  createFormButtonRow
} from "../../ui/uiKit.js";

import { createPickr } from "../../ui/pickrManager.js";

import {
  createNameField,
  createItemTypeField,  // ✅ correct usage here
  createRarityField,
  createDescriptionField,
  createExtraInfoField,
  createValueField,
  createQuantityField
} from "./universalForm.js";

export function createItemDefinitionForm({ onCancel, onSubmit }) {
  const form = document.createElement("form");
  form.id = "item-definition-form";

  const subheading = document.createElement("h3");
  subheading.id = "def-form-subheading";
  subheading.textContent = "Add / Edit Item";
  form.appendChild(subheading);

  const { row: rowName, input: fldName, colorBtn: colorName } = createNameField("def-name");
  const { row: rowType, select: fldType, colorBtn: colorType } = createItemTypeField("def-type");  // ✅ fixed
  const { row: rowRarity, select: fldRarity, colorBtn: colorRarity } = createRarityField("def-rarity");
  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } = createDescriptionField("def-description");

  const { row: rowExtra, extraInfo } = createExtraInfoField({ withDividers: true })

  const { row: rowValue, input: fldValue, colorBtn: colorValue } = createValueField("def-value");
  const { row: rowQty, input: fldQty, colorBtn: colorQty } = createQuantityField("def-quantity");

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
    extraInfo.setLines(def.extraLines || [], false);
    fldValue.value = def.value || "";
    fldQty.value = def.quantity || "";
    fldImgS.value = def.imageSmall || "";
    fldImgL.value = def.imageBig || "";
    subheading.textContent = editingId ? "Edit Item" : "Add / Edit Item";
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const payload = {
      id: editingId,
      name: fldName.value.trim(),
      nameColor: fldName.style.color || "#E5E6E8",
      itemType: fldType.value,
      itemTypeColor: fldType.style.color || "#E5E6E8",
      rarity: fldRarity.value,
      rarityColor: fldRarity.style.color || "#E5E6E8",
      description: fldDesc.value.trim(),
      descriptionColor: fldDesc.style.color || "#E5E6E8",
      extraLines: extraInfo.getLines(),
      value: fldValue.value.trim(),
      valueColor: fldValue.style.color || "#E5E6E8",
      quantity: fldQty.value.trim(),
      quantityColor: fldQty.style.color || "#E5E6E8",
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

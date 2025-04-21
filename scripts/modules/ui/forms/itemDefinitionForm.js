// @version: 14
// @file: /scripts/modules/ui/forms/itemDefinitionForm.js

import {
  createImageField,
  createFormButtonRow
} from "../../ui/uiKit.js";

import { createPickr } from "../../ui/pickrManager.js";

import {
  createNameField,
  createItemTypeField,
  createRarityField,
  createDescriptionField,
  createExtraInfoField,
  createValueField,
  createQuantityField
} from "./universalForm.js";

export function createItemDefinitionForm({ onCancel, onSubmit }) {
  const form = document.createElement("form");
  form.id = "item-definition-form";

  // 🔹 Floating Save/Cancel Button Row
  const floatingBtns = document.createElement("div");
  floatingBtns.style.display = "flex";
  floatingBtns.style.gap = "10px";
  floatingBtns.style.position = "absolute";
  floatingBtns.style.top = "16px";
  floatingBtns.style.right = "16px";
  floatingBtns.style.zIndex = "10";

  const btnSave = document.createElement("button");
  btnSave.type = "submit";
  btnSave.textContent = "Save";
  btnSave.className = "ui-button";

  const btnCancel = document.createElement("button");
  btnCancel.type = "button";
  btnCancel.textContent = "Cancel";
  btnCancel.className = "ui-button";
  btnCancel.onclick = onCancel;

  floatingBtns.append(btnSave, btnCancel);
  form.appendChild(floatingBtns); // ⬅ Add before form content

  // 🔹 Subheading
  const subheading = document.createElement("h3");
  subheading.id = "def-form-subheading";
  subheading.textContent = "Add / Edit Item";
  form.appendChild(subheading);

  // 🔹 Fields
  const { row: rowName, input: fldName, colorBtn: colorName } = createNameField("def-name");
  const { row: rowType, select: fldType, colorBtn: colorType } = createItemTypeField("def-type");
  const { row: rowRarity, select: fldRarity, colorBtn: colorRarity } = createRarityField("def-rarity");
  const { row: rowDesc, textarea: fldDesc, colorBtn: colorDesc } = createDescriptionField("def-description");
  const { row: rowExtra, extraInfo } = createExtraInfoField({ withDividers: true });
  const { row: rowValue, input: fldValue, colorBtn: colorValue } = createValueField("def-value");
  const { row: rowQty, input: fldQty, colorBtn: colorQty } = createQuantityField("def-quantity");
  const { row: rowImgS, input: fldImgS } = createImageField("Image S:", "def-image-small");
  const { row: rowImgL, input: fldImgL } = createImageField("Image L:", "def-image-big");

  form.append(
    rowName,
    rowType,
    rowRarity,
    rowDesc,
    rowExtra,
    rowValue,
    rowQty,
    rowImgS,
    rowImgL
    // ⛔ Removed the old bottom-aligned button row
  );

  // 🔹 Form Logic
  let editingId = null;
  const pickrs = new Map();

  function populate(def) {
    editingId = def.id || null;
    const safe = (v, d = "") => v ?? d;

    fldName.value = safe(def.name);
    fldName.style.color = safe(def.nameColor, "#E5E6E8");
    pickrs.get(colorName)?.setColor(def.nameColor || "#E5E6E8");

    fldType.value = safe(def.itemType);
    fldType.style.color = safe(def.itemTypeColor, "#E5E6E8");
    pickrs.get(colorType)?.setColor(def.itemTypeColor || "#E5E6E8");

    fldRarity.value = safe(def.rarity);
    fldRarity.style.color = safe(def.rarityColor, "#E5E6E8");
    pickrs.get(colorRarity)?.setColor(def.rarityColor || "#E5E6E8");

    fldDesc.value = safe(def.description);
    fldDesc.style.color = safe(def.descriptionColor, "#E5E6E8");
    pickrs.get(colorDesc)?.setColor(def.descriptionColor || "#E5E6E8");

    extraInfo.setLines(safe(def.extraLines, []), false);

    fldValue.value = safe(def.value);
    fldValue.style.color = safe(def.valueColor, "#E5E6E8");
    pickrs.get(colorValue)?.setColor(def.valueColor || "#E5E6E8");

    fldQty.value = safe(def.quantity);
    fldQty.style.color = safe(def.quantityColor, "#E5E6E8");
    pickrs.get(colorQty)?.setColor(def.quantityColor || "#E5E6E8");

    fldImgS.value = safe(def.imageSmall);
    fldImgL.value = safe(def.imageBig);

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
      const p = createPickr(`#${el.id}`);
      pickrs.set(el, p);
    });
  }, 0);

  return {
    form,
    populate,
    reset: () => populate({})
  };
}

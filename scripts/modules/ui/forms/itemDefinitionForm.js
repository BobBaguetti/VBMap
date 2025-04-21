// @version: 18
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

export function createItemDefinitionForm({ onCancel, onSubmit, onDelete }) {
  const form = document.createElement("form");
  form.id = "item-definition-form";

  // 🔹 Subheading + Floating Buttons Wrapper
  const subheadingWrap = document.createElement("div");
  subheadingWrap.style.display = "flex";
  subheadingWrap.style.justifyContent = "space-between";
  subheadingWrap.style.alignItems = "center";

  const subheading = document.createElement("h3");
  subheading.id = "def-form-subheading";
  subheading.textContent = "Add Item";
  subheadingWrap.appendChild(subheading);

  // 🔹 Floating Save/Cancel/Clear/Delete Button Row
  const floatingBtns = document.createElement("div");
  floatingBtns.style.display = "flex";
  floatingBtns.style.gap = "10px";

  const btnSave = document.createElement("button");
  btnSave.type = "submit";
  btnSave.textContent = "Save";
  btnSave.className = "ui-button";

  const btnCancel = document.createElement("button");
  btnCancel.type = "button";
  btnCancel.textContent = "Cancel";
  btnCancel.className = "ui-button";
  btnCancel.onclick = () => {
    populate({}); // Return to Add Item mode instead of closing modal
  };

  const btnClear = document.createElement("button");
  btnClear.type = "button";
  btnClear.textContent = "Clear";
  btnClear.className = "ui-button";
  btnClear.onclick = () => populate({});

  const btnDelete = document.createElement("button");
  btnDelete.type = "button";
  btnDelete.textContent = "Delete";
  btnDelete.className = "ui-button";
  btnDelete.style.transition = "background 0.3s, color 0.3s";
  btnDelete.onmouseenter = () => {
    btnDelete.style.background = "#922";
    btnDelete.style.color = "#fff";
  };
  btnDelete.onmouseleave = () => {
    btnDelete.style.background = "";
    btnDelete.style.color = "";
  };
  btnDelete.onclick = () => {
    if (editingId && confirm(`Are you sure you want to delete \"${fldName.value}\"?`)) {
      onDelete?.(editingId);
    }
  };

  floatingBtns.append(btnSave);
  subheadingWrap.appendChild(floatingBtns);
  form.appendChild(subheadingWrap);

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

    subheading.textContent = editingId ? "Edit Item" : "Add Item";

    // Update button row
    floatingBtns.innerHTML = "";
    floatingBtns.append(btnSave);
    if (editingId) {
      floatingBtns.append(btnCancel, btnDelete);
    } else {
      floatingBtns.append(btnClear);
    }
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = fldName.value.trim();
    if (!name) {
      alert("Name is required.");
      fldName.focus();
      return;
    }

    const payload = {
      id: editingId,
      name,
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
    if (!editingId) populate({}); // Reset form after add
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

// @version: 14
// @file: /scripts/modules/ui/forms/itemDefinitionForm.js

import { createTextField, createDropdownField, createTextareaFieldWithColor, createImageField, createVideoField, createExtraInfoBlock } from "../../universalForm.js";
import { createIcon } from "../../utils/iconUtils.js";

export function createItemDefinitionForm({ onSubmit, onCancel }) {
  const form = document.createElement("form");
  form.id = "item-definition-form";

  const heading = document.createElement("h3");
  heading.id = "def-form-subheading";
  heading.textContent = "Add Item";

  const buttonRow = document.createElement("div");
  buttonRow.className = "field-row";
  buttonRow.style.justifyContent = "flex-end";

  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.className = "ui-button";
  saveBtn.textContent = "Save";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "ui-button";
  cancelBtn.textContent = "Clear";
  cancelBtn.addEventListener("click", () => {
    if (editing) {
      setEditing(null);
      cancelBtn.textContent = "Clear";
    }
    reset();
    onCancel?.();
  });

  buttonRow.append(saveBtn, cancelBtn);

  const fields = {};

  const { row: nameRow, input: nameInput, colorBtn: nameColor } = createTextField("Name", "def-name");
  const { row: typeRow, select: typeSelect, colorBtn: typeColor } = createDropdownField("Item Type", "def-type", [
    { label: "Crafting Material", value: "Crafting Material" },
    { label: "Special", value: "Special" },
    { label: "Consumable", value: "Consumable" },
    { label: "Quest", value: "Quest" }
  ]);
  const { row: rarityRow, select: raritySelect, colorBtn: rarityColor } = createDropdownField("Rarity", "def-rarity", [
    { label: "Common", value: "common" },
    { label: "Uncommon", value: "uncommon" },
    { label: "Rare", value: "rare" },
    { label: "Epic", value: "epic" },
    { label: "Legendary", value: "legendary" }
  ]);
  const { row: descRow, textarea: descArea, colorBtn: descColor } = createTextareaFieldWithColor("Description", "def-description");
  const extra = createExtraInfoBlock();

  const imgRow = createImageField("Image S", "def-image-small");
  const bigImgRow = createImageField("Image L", "def-image-big");

  fields.nameInput = nameInput;
  fields.nameColor = nameColor;
  fields.typeSelect = typeSelect;
  fields.typeColor = typeColor;
  fields.raritySelect = raritySelect;
  fields.rarityColor = rarityColor;
  fields.descArea = descArea;
  fields.descColor = descColor;
  fields.extraBlock = extra;
  fields.imageSmall = imgRow.input;
  fields.imageBig = bigImgRow.input;

  let editing = null;

  function reset() {
    form.reset();
    Object.values(fields).forEach(field => {
      if (field.setColor) field.setColor("#E5E6E8");
    });
    extra.setLines([]);
    heading.textContent = "Add Item";
    cancelBtn.textContent = "Clear";
    editing = null;
  }

  function populate(def) {
    editing = def.id;
    heading.textContent = "Edit Item";
    cancelBtn.textContent = "Cancel Edit";

    fields.nameInput.value = def.name || "";
    fields.nameColor._pickr.setColor(def.nameColor || "#E5E6E8");

    fields.typeSelect.value = def.itemType || "";
    fields.typeColor._pickr.setColor(def.itemTypeColor || "#E5E6E8");

    fields.raritySelect.value = def.rarity || "";
    fields.rarityColor._pickr.setColor(def.rarityColor || "#E5E6E8");

    fields.descArea.value = def.description || "";
    fields.descColor._pickr.setColor(def.descriptionColor || "#E5E6E8");

    fields.extraBlock.setLines(def.extraLines || []);

    fields.imageSmall.value = def.imageSmall || "";
    fields.imageBig.value = def.imageBig || "";
  }

  function setEditing(id) {
    editing = id;
  }

  form.append(heading, buttonRow, nameRow, typeRow, rarityRow, descRow);

  const labelRow = document.createElement("div");
  labelRow.className = "field-row";
  const extraLabel = document.createElement("label");
  extraLabel.textContent = "Extra Info:";
  labelRow.appendChild(extraLabel);
  form.append(labelRow, extra.block);

  form.append(imgRow.row, bigImgRow.row);

  form.addEventListener("submit", e => {
    e.preventDefault();
    onSubmit({
      id: editing,
      name: nameInput.value,
      nameColor: nameColor._pickr.getColor().toHEXA().toString(),
      itemType: typeSelect.value,
      itemTypeColor: typeColor._pickr.getColor().toHEXA().toString(),
      rarity: raritySelect.value,
      rarityColor: rarityColor._pickr.getColor().toHEXA().toString(),
      description: descArea.value,
      descriptionColor: descColor._pickr.getColor().toHEXA().toString(),
      extraLines: extra.getLines(),
      imageSmall: fields.imageSmall.value,
      imageBig: fields.imageBig.value
    });
  });

  return {
    form,
    reset,
    populate,
    setEditing
  };
}

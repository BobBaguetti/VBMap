// @version: 1
// @file: /scripts/modules/ui/forms/itemFormController.js

import { createPickr } from "../ui/pickrManager.js";
import { getPickrHexColor } from "../../utils/colorUtils.js";
import { createItemFormLayout } from "./itemFormBuilder.js";

/**
 * Creates a controller around a form layout for item definitions.
 * Handles wiring, reset, populate, and getCustom logic.
 */
export function createItemFormController({ onCancel, onSubmit, onDelete }) {
  const { form, fields } = createItemFormLayout();

  function reset() {
    fields.fldName.value = "";
    fields.fldType.value = "";
    fields.fldRarity.value = "";
    fields.fldDesc.value = "";
    fields.fldValue.value = "";
    fields.fldQty.value = "";
    fields.fldImgS.value = "";
    fields.fldImgL.value = "";
    fields.fldVid.value = "";
    fields.extraInfo.setLines([]);
    _id = null;
    _subheading.textContent = "Add Item";
  }

  function populate(def) {
    fields.fldName.value   = def.name || "";
    fields.fldType.value   = def.itemType || "";
    fields.fldRarity.value = def.rarity || "";
    fields.fldDesc.value   = def.description || "";
    fields.fldValue.value  = def.value || "";
    fields.fldQty.value    = def.quantity || "";
    fields.fldImgS.value   = def.imageSmall || "";
    fields.fldImgL.value   = def.imageLarge || "";
    fields.fldVid.value    = def.video || "";
    fields.extraInfo.setLines(def.extraInfo || []);
    _id = def.id || null;
    _subheading.textContent = "Edit Item";
  }

  function getCustom() {
    return {
      id:         _id,
      name:       fields.fldName.value.trim(),
      nameColor:  getPickrHexColor(fields.colorName),
      itemType:   fields.fldType.value,
      itemTypeColor: getPickrHexColor(fields.colorType),
      rarity:     fields.fldRarity.value,
      rarityColor: getPickrHexColor(fields.colorRarity),
      description: fields.fldDesc.value.trim(),
      descColor:  getPickrHexColor(fields.colorDesc),
      value:      fields.fldValue.value.trim(),
      valueColor: getPickrHexColor(fields.colorValue),
      quantity:   fields.fldQty.value.trim(),
      quantityColor: getPickrHexColor(fields.colorQty),
      imageSmall: fields.fldImgS.value.trim(),
      imageLarge: fields.fldImgL.value.trim(),
      video:      fields.fldVid.value.trim(),
      extraInfo:  fields.extraInfo.getLines()
    };
  }

  function setFieldColor(field, color) {
    const map = {
      name: fields.colorName,
      itemType: fields.colorType,
      rarity: fields.colorRarity,
      description: fields.colorDesc,
      value: fields.colorValue,
      quantity: fields.colorQty
    };
    if (map[field]) {
      const pickr = createPickr(`#${map[field].id}`);
      pickr.setColor(color);
    }
  }

  const _subheading = document.createElement("h3");
  _subheading.textContent = "Add Item";
  form.prepend(_subheading);

  const buttonRow = document.createElement("div");
  buttonRow.className = "floating-buttons";

  const btnSave = document.createElement("button");
  btnSave.type = "submit";
  btnSave.className = "ui-button";
  btnSave.textContent = "Save";

  const btnCancel = document.createElement("button");
  btnCancel.type = "button";
  btnCancel.className = "ui-button";
  btnCancel.textContent = "Cancel";
  btnCancel.onclick = onCancel;

  const btnDelete = document.createElement("button");
  btnDelete.type = "button";
  btnDelete.className = "ui-button-delete entry-delete";
  btnDelete.title = "Delete this item";
  btnDelete.innerHTML = "🗑️";
  btnDelete.onclick = () => { if (_id) onDelete?.(_id); };

  buttonRow.append(btnSave, btnCancel, btnDelete);
  _subheading.appendChild(buttonRow);

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (onSubmit) {
      const payload = getCustom();
      await onSubmit(payload);
    }
  });

  let _id = null;

  return {
    form,
    reset,
    populate,
    getCustom,
    setFieldColor
  };
}

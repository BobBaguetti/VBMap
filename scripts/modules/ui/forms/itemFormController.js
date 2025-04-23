// @version: 6
// @file: /scripts/modules/ui/forms/itemFormController.js

import { createPickr } from "../pickrManager.js";
import { getPickrHexColor } from "../../utils/colorUtils.js";
import { createItemFormLayout } from "./itemFormBuilder.js";

export function createItemFormController({ onCancel, onSubmit, onDelete, onChange }) {
  const { form, fields } = createItemFormLayout();
  const pickrs = {};

  function destroyPickrs() {
    for (const key in pickrs) {
      pickrs[key]?.destroy?.();
      delete pickrs[key];
    }
  }

  function initPickrs() {
    destroyPickrs();
    requestAnimationFrame(() => {
      const colorTargets = {
        name: fields.colorName,
        itemType: fields.colorType,
        rarity: fields.colorRarity,
        description: fields.colorDesc,
        value: fields.colorValue,
        quantity: fields.colorQty
      };

      for (const [key, el] of Object.entries(colorTargets)) {
        const btn = document.getElementById(el.id);
        if (btn) btn.innerHTML = "";

        const pickr = createPickr(`#${el.id}`);
        pickrs[key] = pickr;

        if (onChange) {
          pickr.on("change", () => {
            const def = getCustom();
            onChange(def);
          });
        }
      }
    });
  }

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

    for (const key in pickrs) {
      pickrs[key]?.setColor(null);
    }
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

    // Defer color application until after Pickrs are ready
    setTimeout(() => applyVisualColors(def), 50);
  }

  function getCustom() {
    return {
      id:         _id,
      name:       fields.fldName.value.trim(),
      nameColor:  getPickrHexColor(pickrs.name),
      itemType:   fields.fldType.value,
      itemTypeColor: getPickrHexColor(pickrs.itemType),
      rarity:     fields.fldRarity.value,
      rarityColor: getPickrHexColor(pickrs.rarity),
      description: fields.fldDesc.value.trim(),
      descColor:  getPickrHexColor(pickrs.description),
      value:      fields.fldValue.value.trim(),
      valueColor: getPickrHexColor(pickrs.value),
      quantity:   fields.fldQty.value.trim(),
      quantityColor: getPickrHexColor(pickrs.quantity),
      imageSmall: fields.fldImgS.value.trim(),
      imageLarge: fields.fldImgL.value.trim(),
      video:      fields.fldVid.value.trim(),
      extraInfo:  fields.extraInfo.getLines()
    };
  }

  function setFieldColor(field, color) {
    const target = pickrs[field];
    if (target && color) target.setColor(color);
  }

  function applyVisualColors(def) {
    if (def.nameColor)     setFieldColor("name", def.nameColor);
    if (def.itemTypeColor) setFieldColor("itemType", def.itemTypeColor);
    if (def.rarityColor)   setFieldColor("rarity", def.rarityColor);
    if (def.descColor)     setFieldColor("description", def.descColor);
    if (def.valueColor)    setFieldColor("value", def.valueColor);
    if (def.quantityColor) setFieldColor("quantity", def.quantityColor);
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
    setFieldColor,
    initPickrs,
    applyVisualColors
  };
}

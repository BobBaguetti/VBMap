// @comment: Comments should not be deleted unless they need updating due to specific commented code changing or the code part is removed.
// @file: /scripts/modules/ui/forms/controllers/itemFormController.js
// @version: 4.6

import { createPickr } from "../../pickrManager.js";
import { getPickrHexColor } from "../../../utils/colorUtils.js";
import { createItemForm } from "../builders/itemFormBuilder.js";
import { createIcon } from "../../../utils/iconUtils.js";

/**
 * Creates a controller around a form layout for item definitions.
 * Handles wiring, reset, populate, and getCustom logic.
 */
export function createItemFormController({ onCancel, onSubmit, onDelete }) {
  const { form, fields } = createItemForm();
  const pickrs = {};

  // ─── Header + Buttons ───────────────────────────────────────────────
  const subheadingWrap = document.createElement("div");
  subheadingWrap.style.display = "flex";
  subheadingWrap.style.justifyContent = "space-between";
  subheadingWrap.style.alignItems = "center";

  const subheading = document.createElement("h3");
  subheading.textContent = "Add Item";
  subheadingWrap.appendChild(subheading);

  const buttonRow = document.createElement("div");
  buttonRow.className = "floating-buttons";

  const btnSave = document.createElement("button");
  btnSave.type = "submit";
  btnSave.className = "ui-button";
  btnSave.textContent = "Save";

  const btnClear = document.createElement("button");
  btnClear.type = "button";
  btnClear.className = "ui-button";
  btnClear.textContent = "Clear";
  btnClear.onclick = onCancel;

  const btnDelete = document.createElement("button");
  btnDelete.type = "button";
  btnDelete.className = "ui-button-delete";
  btnDelete.title = "Delete this item";
  btnDelete.style.width = "28px";
  btnDelete.style.height = "28px";
  btnDelete.appendChild(createIcon("trash"));
  btnDelete.onclick = () => { if (_id) onDelete?.(_id); };
  btnDelete.style.display = "none"; // hidden in Add mode

  buttonRow.append(btnSave, btnClear, btnDelete);
  subheadingWrap.appendChild(buttonRow);
  form.prepend(subheadingWrap);

  // ─── Pickr Initialization ──────────────────────────────────────────
  function initPickrs() {
    Object.entries({
      name:        fields.colorName,
      itemType:    fields.colorType,
      rarity:      fields.colorRarity,
      description: fields.colorDesc,
      value:       fields.colorValue,
      quantity:    fields.colorQty
    }).forEach(([key, btn]) => {
      if (!pickrs[key] && document.body.contains(btn)) {
        pickrs[key] = createPickr(`#${btn.id}`);
      }
    });
  }

  // ─── Reset to Add mode ─────────────────────────────────────────────
  function reset() {
    fields.fldName.value   = "";
    fields.fldType.value   = "";
    fields.fldRarity.value = "";
    fields.fldDesc.value   = "";
    fields.fldValue.value  = "";
    fields.fldQty.value    = "";
    fields.fldImgS.value   = "";
    fields.fldImgL.value   = "";
    fields.extraInfo.setLines([]);
    _id = null;
    subheading.textContent = "Add Item";
    btnDelete.style.display = "none";

    initPickrs();
    // reset pickers to default grey
    Object.values(pickrs).forEach(p => p.setColor("#E5E6E8"));
  }

  // ─── Populate for Edit mode ────────────────────────────────────────
  function populate(def) {
    fields.fldName.value      = def.name || "";
    fields.fldType.value      = def.itemType || "";
    fields.fldRarity.value    = def.rarity || "";
    fields.fldDesc.value      = def.description || "";
    fields.fldValue.value     = def.value || "";
    fields.fldQty.value       = def.quantity || "";
    fields.fldImgS.value      = def.imageSmall || "";
    fields.fldImgL.value      = def.imageLarge || "";
    fields.extraInfo.setLines(def.extraInfo || []);
    _id = def.id || null;
    subheading.textContent = "Edit Item";
    btnDelete.style.display = "";

    initPickrs();
    // reapply saved colors
    pickrs.name.setColor(def.nameColor      || "#E5E6E8");
    pickrs.itemType.setColor(def.itemTypeColor || "#E5E6E8");
    pickrs.rarity.setColor(def.rarityColor    || "#E5E6E8");
    pickrs.description.setColor(def.descColor  || "#E5E6E8");
    pickrs.value.setColor(def.valueColor     || "#E5E6E8");
    pickrs.quantity.setColor(def.quantityColor || "#E5E6E8");
  }

  // ─── Gather form data ──────────────────────────────────────────────
  function getCustom() {
    return {
      id:             _id,
      name:           fields.fldName.value.trim(),
      nameColor:      getPickrHexColor(pickrs.name),
      itemType:       fields.fldType.value,
      itemTypeColor:  getPickrHexColor(pickrs.itemType),
      rarity:         fields.fldRarity.value,
      rarityColor:    getPickrHexColor(pickrs.rarity),
      description:    fields.fldDesc.value.trim(),
      descColor:      getPickrHexColor(pickrs.description),
      value:          fields.fldValue.value.trim(),
      valueColor:     getPickrHexColor(pickrs.value),
      quantity:       fields.fldQty.value.trim(),
      quantityColor:  getPickrHexColor(pickrs.quantity),
      imageSmall:     fields.fldImgS.value.trim(),
      imageLarge:     fields.fldImgL.value.trim(),
      extraInfo:      fields.extraInfo.getLines()
    };
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (onSubmit) await onSubmit(getCustom());
  });

  let _id = null;
  return { form, reset, populate, getCustom, initPickrs, buttonRow };
}

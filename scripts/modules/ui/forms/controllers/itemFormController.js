// @comment: Comments should not be deleted unless they need updating or code is removed.
// @file: /scripts/modules/ui/forms/controllers/itemFormController.js
// @version: 4.17

import { createPickr, destroyAllPickrs }       from "../../pickrManager.js";
import { getPickrHexColor, applyColorPresets } from "../../../utils/colorUtils.js";
import { createItemForm }                      from "../builders/itemFormBuilder.js";
import { createIcon }                          from "../../../utils/iconUtils.js";

/**
 * Creates a controller around a form layout for item definitions.
 * Handles wiring, reset, populate, and getCustom logic.
 */
export function createItemFormController({ onCancel, onSubmit, onDelete }) {
  const { form, fields } = createItemForm();
  const pickrs = {};

  // ─── Header + Buttons ───────────────────────────────────────────────
  const subheadingWrap = document.createElement("div");
  Object.assign(subheadingWrap.style, {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center"
  });

  const subheading = document.createElement("h3");
  subheading.textContent = "Add Item";
  subheadingWrap.appendChild(subheading);

  const buttonRow = document.createElement("div");
  buttonRow.className = "floating-buttons";

  const btnSave = document.createElement("button");
  btnSave.type      = "submit";
  btnSave.className = "ui-button";
  btnSave.textContent = "Save";

  const btnClear = document.createElement("button");
  btnClear.type      = "button";
  btnClear.className = "ui-button";
  btnClear.textContent = "Clear";
  btnClear.onclick   = onCancel;

  const btnDelete = document.createElement("button");
  btnDelete.type      = "button";
  btnDelete.className = "ui-button-delete";
  btnDelete.title     = "Delete this item";
  btnDelete.style.width  = "28px";
  btnDelete.style.height = "28px";
  btnDelete.appendChild(createIcon("trash"));
  btnDelete.style.display = "none"; // hidden in Add mode
  btnDelete.onclick = () => {
    if (_id != null && confirm(`Delete "${fields.fldName.value}"?`)) {
      onDelete?.(_id);
    }
  };

  buttonRow.append(btnSave, btnClear, btnDelete);
  subheadingWrap.appendChild(buttonRow);
  form.prepend(subheadingWrap);

  // ─── Pickr Initialization ──────────────────────────────────────────
  function initPickrs() {
    const map = {
      name:        fields.colorName,
      itemType:    fields.colorType,
      rarity:      fields.colorRarity,
      description: fields.colorDesc,
      value:       fields.colorValue,
      quantity:    fields.colorQty
    };

    Object.entries(map).forEach(([key, btn]) => {
      if (!pickrs[key] && document.body.contains(btn)) {
        const p = createPickr(`#${btn.id}`);
        pickrs[key] = p;
        p.on("change", color => {
          console.log(`[pickr:${key}] change →`, color.toHEXA().toString());
          form.dispatchEvent(new Event("input", { bubbles: true }));
        });
        p.on("save", () => {
          console.log(`[pickr:${key}] save →`, p.getColor().toHEXA().toString());
          form.dispatchEvent(new Event("input", { bubbles: true }));
        });
      }
    });
  }

  // ─── Sync Presets on Rarity or Type Change ─────────────────────────
  function applyPresetsAndRefresh() {
    initPickrs();

    const tmp = {
      itemType: fields.fldType.value,
      rarity:   fields.fldRarity.value
    };
    applyColorPresets(tmp);

    console.log("[applyPresets] tmp →", tmp);

    const D = "#E5E6E8";
    pickrs.name?.setColor(tmp.nameColor        ?? D);
    pickrs.itemType?.setColor(tmp.itemTypeColor ?? D);
    pickrs.rarity?.setColor(tmp.rarityColor     ?? D);

    form.dispatchEvent(new Event("input", { bubbles: true }));
  }

  fields.fldRarity.addEventListener("change", applyPresetsAndRefresh);
  fields.fldType  .addEventListener("change", applyPresetsAndRefresh);

  // ─── Reset to Add mode ─────────────────────────────────────────────
  function reset() {
    ["fldName","fldType","fldRarity","fldDesc","fldValue","fldQty","fldImgS","fldImgL"]
      .forEach(k => fields[k].value = "");
    fields.extraInfo.setLines([], false);

    _id = null;
    subheading.textContent = "Add Item";
    btnDelete.style.display = "none";

    destroyAllPickrs();
    Object.keys(pickrs).forEach(k => delete pickrs[k]);
  }

  // ─── Populate for Edit mode ────────────────────────────────────────
  function populate(def) {
    fields.fldName.value   = def.name         || "";
    fields.fldType.value   = def.itemType     || "";
    fields.fldRarity.value = def.rarity       || "";
    fields.fldDesc.value   = def.description  || "";
    fields.fldValue.value  = def.value        || "";
    fields.fldQty.value    = def.quantity     || "";
    fields.fldImgS.value   = def.imageSmall   || "";
    fields.fldImgL.value   = def.imageLarge   || "";
    fields.extraInfo.setLines(def.extraInfo || [], false);

    _id = def.id || null;
    subheading.textContent = "Edit Item";
    btnDelete.style.display = "";

    initPickrs();
    pickrs.name?.setColor(def.nameColor         || "#E5E6E8");
    pickrs.itemType?.setColor(def.itemTypeColor || "#E5E6E8");
    pickrs.rarity?.setColor(def.rarityColor     || "#E5E6E8");
    // ⬇ fix here:
    pickrs.description?.setColor(def.descriptionColor || "#E5E6E8");
    pickrs.value?.setColor(def.valueColor       || "#E5E6E8");
    pickrs.quantity?.setColor(def.quantityColor || "#E5E6E8");
  }

  // ─── Gather form data ──────────────────────────────────────────────
  function getCustom() {
    const result = {
      id:                _id,
      name:              fields.fldName.value.trim(),
      nameColor:         getPickrHexColor(pickrs.name),
      itemType:          fields.fldType.value,
      itemTypeColor:     getPickrHexColor(pickrs.itemType),
      rarity:            fields.fldRarity.value,
      rarityColor:       getPickrHexColor(pickrs.rarity),
      description:       fields.fldDesc.value.trim(),
      // ⬇ fix here:
      descriptionColor:  getPickrHexColor(pickrs.description),
      value:             fields.fldValue.value.trim(),
      valueColor:        getPickrHexColor(pickrs.value),
      quantity:          fields.fldQty.value.trim(),
      quantityColor:     getPickrHexColor(pickrs.quantity),
      imageSmall:        fields.fldImgS.value.trim(),
      imageLarge:        fields.fldImgL.value.trim(),
      extraInfo:         fields.extraInfo.getLines()
    };
    console.log("[getCustom] live data →", result);
    return result;
  }

  // ─── Live‐preview event hookup ──────────────────────────────────────
  form.addEventListener("input", () => {
    // modal code listens for form 'input' → previewApi.setFromDefinition(...)
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (onSubmit) await onSubmit(getCustom());
  });

  let _id = null;
  return { form, reset, populate, getCustom, initPickrs, buttonRow };
}

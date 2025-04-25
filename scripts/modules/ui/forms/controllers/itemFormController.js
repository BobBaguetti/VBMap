// @comment: Comments should not be deleted unless they need updating or code is removed.
// @file: /scripts/modules/ui/forms/controllers/itemFormController.js
// @version: 4.26

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
  btnDelete.type        = "button";
  btnDelete.className   = "ui-button-delete";
  btnDelete.title       = "Delete this item";
  btnDelete.style.width = "28px";
  btnDelete.style.height= "28px";
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
        // re-fire form input for live preview
        p.on("change", () => form.dispatchEvent(new Event("input", { bubbles: true })));
        p.on("save",   () => form.dispatchEvent(new Event("input", { bubbles: true })));
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
    // ensure nameColor always falls back to rarityColor or itemTypeColor
    tmp.nameColor = tmp.nameColor || tmp.rarityColor || tmp.itemTypeColor;
    // log any missing preset keys
    ["nameColor","itemTypeColor","rarityColor"].forEach(k => {
      if (!tmp[k]) console.warn(`[presets] missing ${k} for`, tmp);
    });
    // apply to swatches (delay to avoid race)
    setTimeout(() => {
      tmp.nameColor     && pickrs.name?.setColor(tmp.nameColor);
      tmp.itemTypeColor && pickrs.itemType?.setColor(tmp.itemTypeColor);
      tmp.rarityColor   && pickrs.rarity?.setColor(tmp.rarityColor);
      form.dispatchEvent(new Event("input", { bubbles: true }));
    }, 0);
  }

  fields.fldRarity.addEventListener("change", applyPresetsAndRefresh);
  fields.fldType  .addEventListener("change", applyPresetsAndRefresh);

  // ─── Reset to Add mode ─────────────────────────────────────────────
  function reset() {
    // clear all fields
    fields.fldName.value   =
    fields.fldType.value   =
    fields.fldRarity.value =
    fields.fldDesc.value   =
    fields.fldValue.value  =
    fields.fldQty.value    =
    fields.fldImgS.value   =
    fields.fldImgL.value   = "";

    // clear extra-info rows
    fields.extraInfo.setLines([], false);

    _id = null;
    subheading.textContent = "Add Item";
    btnDelete.style.display = "none";
    btnClear.textContent    = "Clear";

    // destroy pickr instances and clear our map
    destroyAllPickrs();
    Object.keys(pickrs).forEach(k => delete pickrs[k]);

    // remove all inline styles from swatch buttons
    form.querySelectorAll(".color-btn").forEach(btn => {
      btn.removeAttribute("style");
    });
  }

  // ─── Populate for Edit mode ────────────────────────────────────────
  function populate(def) {
    fields.fldName.value   = def.name        || "";
    fields.fldType.value   = def.itemType    || "";
    fields.fldRarity.value = def.rarity      || "";
    fields.fldDesc.value   = def.description || "";
    fields.fldValue.value  = def.value       || "";
    fields.fldQty.value    = def.quantity    || "";
    fields.fldImgS.value   = def.imageSmall  || "";
    fields.fldImgL.value   = def.imageLarge  || "";

    // read from def.extraLines instead of def.extraInfo
    fields.extraInfo.setLines(def.extraLines || [], false);

    _id = def.id || null;
    subheading.textContent = "Edit Item";
    btnDelete.style.display = "";
    btnClear.textContent    = "Cancel";

    initPickrs();
    def.nameColor        && pickrs.name?.setColor(def.nameColor);
    def.itemTypeColor    && pickrs.itemType?.setColor(def.itemTypeColor);
    def.rarityColor      && pickrs.rarity?.setColor(def.rarityColor);
    def.descriptionColor && pickrs.description?.setColor(def.descriptionColor);
    def.valueColor       && pickrs.value?.setColor(def.valueColor);
    def.quantityColor    && pickrs.quantity?.setColor(def.quantityColor);
  }

  // ─── Gather form data ──────────────────────────────────────────────
  function getCustom() {
    return {
      id:               _id,
      name:             fields.fldName.value.trim(),
      nameColor:        getPickrHexColor(pickrs.name),
      itemType:         fields.fldType.value,
      itemTypeColor:    getPickrHexColor(pickrs.itemType),
      rarity:           fields.fldRarity.value,
      rarityColor:      getPickrHexColor(pickrs.rarity),
      description:      fields.fldDesc.value.trim(),
      descriptionColor: getPickrHexColor(pickrs.description),
      value:            fields.fldValue.value.trim(),
      valueColor:       getPickrHexColor(pickrs.value),
      quantity:         fields.fldQty.value.trim(),
      quantityColor:    getPickrHexColor(pickrs.quantity),
      imageSmall:       fields.fldImgS.value.trim(),
      imageLarge:       fields.fldImgL.value.trim(),
      extraLines:       fields.extraInfo.getLines()
    };
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (onSubmit) await onSubmit(getCustom());
  });

  let _id = null;
  return { form, reset, populate, getCustom, initPickrs, buttonRow };
}

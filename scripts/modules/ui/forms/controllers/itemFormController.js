// @comment: Comments should not be deleted unless they need updating or code is removed.
// @file: /scripts/modules/ui/forms/controllers/itemFormController.js
// @version: 4.28

import { createPickr }                        from "../../pickrManager.js";
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
  let _id = null;

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
      if (!pickrs[key]) {
        const p = createPickr(`#${btn.id}`);
        pickrs[key] = p;

        // force-open on swatch click
        btn.addEventListener("click", () => p.show());

        // re-fire input for live preview
        p.on("change", () => form.dispatchEvent(new Event("input", { bubbles: true })));
        p.on("save",   () => form.dispatchEvent(new Event("input", { bubbles: true })));
      }
    });
  }

  // ─── Sync Presets on Rarity or Type Change ─────────────────────────
  function applyPresetsAndRefresh() {
    // only run once both selects have real values
    if (!fields.fldType.value || !fields.fldRarity.value) {
      return;
    }

    initPickrs();

    const tmp = {
      itemType: fields.fldType.value,
      rarity:   fields.fldRarity.value
    };
    applyColorPresets(tmp);

    // ensure nameColor always falls back
    tmp.nameColor = tmp.nameColor || tmp.rarityColor || tmp.itemTypeColor;

    setTimeout(() => {
      if (tmp.nameColor)     pickrs.name.setColor(tmp.nameColor);
      if (tmp.itemTypeColor) pickrs.itemType.setColor(tmp.itemTypeColor);
      if (tmp.rarityColor)   pickrs.rarity.setColor(tmp.rarityColor);
      form.dispatchEvent(new Event("input", { bubbles: true }));
    }, 0);
  }

  fields.fldType .addEventListener("change", applyPresetsAndRefresh);
  fields.fldRarity.addEventListener("change", applyPresetsAndRefresh);

  // ─── Reset to Add mode ─────────────────────────────────────────────
  function reset() {
    form.reset();
    fields.fldType.value   = "";
    fields.fldRarity.value = "";

    fields.extraInfo.setLines([], false);

    _id = null;
    subheading.textContent = "Add Item";
    btnDelete.style.display = "none";
    btnClear.textContent    = "Clear";

    initPickrs();
    Object.values(pickrs).forEach(p => p.setColor("#E5E6E8"));
  }

  // ─── Populate for Edit mode ────────────────────────────────────────
  function populate(def) {
    form.reset();
    fields.fldName.value   = def.name        || "";
    fields.fldType.value   = def.itemType    || "";
    fields.fldRarity.value = def.rarity      || "";
    fields.fldDesc.value   = def.description || "";
    fields.fldValue.value  = def.value       || "";
    fields.fldQty.value    = def.quantity    || "";
    fields.fldImgS.value   = def.imageSmall  || "";
    fields.fldImgL.value   = def.imageLarge  || "";

    fields.extraInfo.setLines(def.extraLines || [], false);

    _id = def.id || null;
    subheading.textContent = "Edit Item";
    btnDelete.style.display = "";
    btnClear.textContent    = "Cancel";

    initPickrs();
    if (def.nameColor)        pickrs.name.setColor(def.nameColor);
    if (def.itemTypeColor)    pickrs.itemType.setColor(def.itemTypeColor);
    if (def.rarityColor)      pickrs.rarity.setColor(def.rarityColor);
    if (def.descriptionColor) pickrs.description.setColor(def.descriptionColor);
    if (def.valueColor)       pickrs.value.setColor(def.valueColor);
    if (def.quantityColor)    pickrs.quantity.setColor(def.quantityColor);
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

  return { form, reset, populate, getCustom, initPickrs, buttonRow };
}

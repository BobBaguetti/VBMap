// @file: src/modules/ui/forms/controllers/chestFormController.js
// @version: 2.21 — add icon rendering to loot-pool chips

import { getPickrHexColor }                from "../../utils/colorUtils.js";
import {
  CHEST_RARITY,
  rarityColors,
  defaultNameColor
}                                          from "../../map/markerManager.js";
import { createChestForm }                 from "../builders/chestFormBuilder.js";
import {
  createFormControllerHeader,
  wireFormEvents
}                                          from "../components/formControllerShell.js";
import { initFormPickrs }                  from "../components/formPickrManager.js";
import { createFormState }                 from "../components/formStateManager.js";
import { pickItems }                       from "../components/listPicker.js";
// ← updated import to match your new chipListManager API:
import { createChipList }                  from "../components/chipListManager.js";
import { loadItemDefinitions }             from "../../../modules/services/itemDefinitionsService.js";

export function createChestFormController(
  { onCancel, onSubmit, onDelete, onFieldChange },
  db
) {
  const { form, fields } = createChestForm();

  // Header + Buttons
  const {
    container: subheadingWrap,
    subheading,
    setDeleteVisible
  } = createFormControllerHeader({
    title:     "Add Chest Type",
    hasFilter: false,
    onCancel:  () => onCancel?.(),
    onDelete:  () => {
      if (_id && confirm("Delete this chest type?")) onDelete?.(_id);
    }
  });
  setDeleteVisible(false);
  form.prepend(subheadingWrap);

  // ─── Auto‐apply nameColor on category/size change ─────────────────
  function applySizeCategoryColor() {
    const cat = fields.fldCategory.value || "Normal";
    const sz  = fields.fldSize.value     || "Small";
    const key = CHEST_RARITY[cat]?.[sz]   || "common";
    const col = rarityColors[key]         || defaultNameColor;
    if (pickrs.name) {
      pickrs.name.setColor(col);
      form.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
  fields.fldCategory.addEventListener("change", applySizeCategoryColor);
  fields.fldSize    .addEventListener("change", applySizeCategoryColor);

  // ─── Pickr wiring ──────────────────────────────────────────────
  const pickrs = initFormPickrs(form, {
    name:        fields.colorName,
    description: fields.colorDesc
  });
  applySizeCategoryColor();

  // ─── Prepare item definitions for label & icon lookup ─────────
  let itemMap = [];
  async function ensureAllItems() {
    if (!itemMap.length) {
      itemMap = await loadItemDefinitions(db);
    }
  }

  // ─── Shared chip-list manager for loot-pool ────────────────────
  // we defer initial render until after items are loaded
  const chipManager = createChipList({
    container:   fields.chipContainer,
    listArray:   fields.lootPool,
    renderLabel: id => {
      const def = itemMap.find(i => i.id === id) || { name: id };
      return def.name;
    },
    // new: render each chip’s icon from the item’s small-image URL
    renderIcon: id => {
      const def = itemMap.find(i => i.id === id) || {};
      return def.imageSmall || "";
    },
    onChange:    () => onFieldChange?.(getCustom())
  });

  // ─── Loot-pool picker button ───────────────────────────────────
  fields.openLootPicker.onclick = async () => {
    await ensureAllItems();
    // now that itemMap is populated, render the chips (with names/icons)
    chipManager.render();

    let chosen;
    try {
      chosen = await pickItems({
        title:    "Select Loot Pool Items",
        items:    itemMap,
        selected: fields.lootPool,
        labelKey: "name"
      });
    } catch {
      return; // user cancelled
    }
    fields.lootPool.splice(0, fields.lootPool.length, ...chosen);
    chipManager.render();
    onFieldChange?.(getCustom());
  };

  // Internal state & payload
  let _id = null;
  function getCustom() {
    return {
      id:               _id,
      name:             fields.fldName.value.trim(),
      nameColor:        getPickrHexColor(pickrs.name),
      category:         fields.fldCategory.value,
      size:             fields.fldSize.value,
      lootPool:         [...fields.lootPool],
      description:      fields.fldDesc.value.trim(),
      descriptionColor: getPickrHexColor(pickrs.description),
      extraLines:       fields.extraInfo.getLines(),
      imageSmall:       fields.fldImgS.value.trim(),
      imageLarge:       fields.fldImgL.value.trim()
    };
  }

  // ─── Shared reset & populate ──────────────────────────────────
  const { reset: _reset, populate: _populate } = createFormState({
    form,
    fields: {
      name:        fields.fldName,
      category:    fields.fldCategory,
      size:        fields.fldSize,
      description: fields.fldDesc,
      imageSmall:  fields.fldImgS,
      imageLarge:  fields.fldImgL
    },
    defaultFieldKeys:    ["name", "description", "imageSmall", "imageLarge"],
    defaultValues:       { size: "Small", category: "Normal" },
    pickrs,
    pickrClearKeys:      ["name", "description"],
    chipLists: [
      {
        fieldArray: fields.lootPool,
        renderFn:   () => chipManager.render(),
        defKey:     "lootPool"
      }
    ],
    subheading,
    setDeleteVisible,
    addTitle:  "Add Chest Type",
    editTitle: "Edit Chest Type",
    getCustom,
    onFieldChange
  });

  function reset() {
    _id = null;
    fields.extraInfo.setLines([], false);
    _reset();
    // ensure chips render after reset
    chipManager.render();
    applySizeCategoryColor();
  }

  function populate(def) {
    _id = def.id || null;
    _populate(def);
    fields.extraInfo.setLines(def.extraLines || [], false);
    // populate and render chips with icons
    chipManager.render();
    applySizeCategoryColor();
  }

  wireFormEvents(form, getCustom, onSubmit, onFieldChange);

  return {
    form,
    reset,
    populate,
    getCustom,
    getCurrentPayload: getCustom,
    initPickrs() {
      Object.assign(
        pickrs,
        initFormPickrs(form, {
          name:        fields.colorName,
          description: fields.colorDesc
        })
      );
    }
  };
}

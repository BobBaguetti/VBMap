// @version: 2.25
// @file: src/modules/ui/forms/controllers/chestFormController.js

/**
 * Creates the controller for the chest-definition form.
 * Handles wiring header, pickrs, state, and loot-pool chip-list.
 */
import { getPickrHexColor }    from "../../../utils/colorUtils.js";
import {
  CHEST_RARITY,
  rarityColors,
  defaultNameColor
}                              from "../../../map/markerManager.js";
import { createChestForm }     from "../builders/chestFormBuilder.js";
import {
  createFormControllerHeader,
  wireFormEvents
}                              from "../../components/formControllerShell.js";
import { initFormPickrs }      from "../../components/formPickrManager.js";
import { createFormState }     from "../../components/formStateManager.js";
import { loadItemDefinitions } from "../../../services/itemDefinitionsService.js";

export function createChestFormController(
  { onCancel, onSubmit, onDelete, onFieldChange },
  db
) {
  const { form, fields } = createChestForm();

  // ─── Header + Buttons ────────────────────────────────────────
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

  // ─── Auto‐apply nameColor on category/size change ────────────
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

  // ─── Pickr wiring ────────────────────────────────────────────
  const pickrs = initFormPickrs(form, {
    name:        fields.colorName,
    description: fields.colorDesc
  });
  applySizeCategoryColor();

  // ─── Load & seed definitions for the Loot Pool picker ───────
  let itemMap = [];
  async function ensureAllItems() {
    if (!itemMap.length) {
      itemMap = await loadItemDefinitions(db);
      // populate the builder’s items array so the picker shows them
      fields.allItems.splice(0, fields.allItems.length, ...itemMap);
    }
    return itemMap;
  }
  // initial seed: load defs then seed selected chips
  ensureAllItems().then(defs => {
    fields.setLootPool(
      defs.filter(d => fields.lootPool.includes(d.id))
    );
  });

  // ─── Internal state & payload ────────────────────────────────
  let _id = null;
  function getCustom() {
    // Use the chip-list helper to get full objects, then map to IDs
    const selectedItems = fields.getLootPool();
    const lootIds = selectedItems.map(item => item.id);

    return {
      id:               _id,
      name:             fields.fldName.value.trim(),
      nameColor:        getPickrHexColor(pickrs.name),
      category:         fields.fldCategory.value,
      size:             fields.fldSize.value,
      // now we correctly save an array of IDs
      lootPool:         lootIds,
      description:      fields.fldDesc.value.trim(),
      descriptionColor: getPickrHexColor(pickrs.description),
      extraLines:       fields.extraInfo.getLines(),
      imageSmall:       fields.fldImgS.value.trim(),
      imageLarge:       fields.fldImgL.value.trim()
    };
  }

  // ─── Shared reset & populate ────────────────────────────────
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
    defaultFieldKeys: ["name", "description", "imageSmall", "imageLarge"],
    defaultValues:    { size: "Small", category: "Normal" },
    pickrs,
    pickrClearKeys:   ["name", "description"],
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
    fields.setLootPool([]);          // clear chips
    applySizeCategoryColor();
  }

  async function populate(def) {
    _id = def.id || null;
    _populate(def);
    fields.extraInfo.setLines(def.extraLines || [], false);
    await ensureAllItems();
    fields.setLootPool(
      itemMap.filter(d => def.lootPool.includes(d.id))
    );
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

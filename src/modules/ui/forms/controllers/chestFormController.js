// @file: src/modules/ui/forms/controllers/chestFormController.js
// @version: 2.18 — wire name-color pickr & preview icon

import { getPickrHexColor }                       from "../../../utils/colorUtils.js";
import { createChestForm }                        from "../builders/chestFormBuilder.js";
import {
  createFormControllerHeader,
  wireFormEvents
}                                                 from "../../components/formControllerShell.js";
import { initFormPickrs }                         from "../../components/formPickrManager.js";
import { createFormState }                        from "../../components/formStateManager.js";
import { pickItems }                              from "../../components/listPicker.js";
import { createChipListManager }                  from "../../components/chipListManager.js";
import { loadItemDefinitions }                    from "../../../services/itemDefinitionsService.js";

export function createChestFormController(
  { onCancel, onSubmit, onDelete, onFieldChange },
  db
) {
  const { form, fields } = createChestForm();

  // ─── Header + Buttons ─────────────────────────────────────────────
  const {
    container: subheadingWrap,
    subheading,
    setDeleteVisible
  } = createFormControllerHeader({
    title:     "Add Chest Type",
    hasFilter: false,
    onCancel:  () => onCancel?.(),
    onDelete:  () => {
      if (_id && confirm("Delete this chest type?")) {
        onDelete?.(_id);
      }
    }
  });
  setDeleteVisible(false);
  form.prepend(subheadingWrap);

  // ─── Pickr wiring ─────────────────────────────────────────────────
  const pickrs = initFormPickrs(form, {
    name:        fields.colorName,   // name swatch
    description: fields.colorDesc
  });

  // ─── Prep items for loot-pool labels ──────────────────────────────
  let itemMap = [];
  async function ensureAllItems() {
    if (!itemMap.length) {
      itemMap = await loadItemDefinitions(db);
    }
  }

  // ─── Shared chip-list manager for loot-pool ───────────────────────
  const chipManager = createChipListManager({
    container:   fields.chipContainer,
    listArray:   fields.lootPool,
    renderLabel: id => (itemMap.find(i => i.id === id) || { name: id }).name,
    onChange:    () => onFieldChange?.(getCustom())
  });

  // ─── Loot-pool picker button ──────────────────────────────────────
  fields.openLootPicker.onclick = async () => {
    await ensureAllItems();
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

  // ─── Internal state & payload getter ─────────────────────────────
  let _id = null;
  function getCustom() {
    return {
      id:               _id,
      name:             fields.fldName.value.trim(),
      nameColor:        getPickrHexColor(pickrs.name),
      size:             fields.fldSize.value,
      category:         fields.fldCategory.value,
      lootPool:         [...fields.lootPool],
      description:      fields.fldDesc.value.trim(),
      descriptionColor: getPickrHexColor(pickrs.description),
      extraLines:       fields.extraInfo.getLines(),
      imageSmall:       fields.fldImgS.value.trim(),
      imageLarge:       fields.fldImgL.value.trim()
    };
  }

  // ─── Shared reset & populate via formStateManager ───────────────
  const { reset: _reset, populate: _populate } = createFormState({
    form,
    fields: {
      name:        fields.fldName,
      size:        fields.fldSize,
      category:    fields.fldCategory,
      description: fields.fldDesc
    },
    defaultFieldKeys: ["name", "description"],
    defaultValues:    { size: "Small", category: "Normal" },
    pickrs,
    pickrClearKeys:   ["name", "description"],
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

  // ─── wrap reset/populate to include chips, pickr, ID ────────────
  function reset() {
    _id = null;
    fields.extraInfo.setLines([], false);
    _reset();
    chipManager.render();
  }

  function populate(def) {
    _id = def.id || null;
    _populate(def);
    fields.extraInfo.setLines(def.extraLines || [], false);
    chipManager.render();
    // restore saved name color
    if (def.nameColor) pickrs.name.setColor(def.nameColor);
  }

  // ─── Wire submit & live-preview ─────────────────────────────────
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

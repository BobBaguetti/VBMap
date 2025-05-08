// @file: src/modules/ui/forms/controllers/chestFormController.js
// @version: 2.18 — wire in name-color Pickr & support image fields for preview

import { getPickrHexColor }                from "../../../utils/colorUtils.js";
import { createChestForm }                 from "../builders/chestFormBuilder.js";
import {
  createFormControllerHeader,
  wireFormEvents
}                                          from "../../components/formControllerShell.js";
import { initFormPickrs }                  from "../../components/formPickrManager.js";
import { createFormState }                 from "../../components/formStateManager.js";
import { pickItems }                       from "../../components/listPicker.js";
import { createChipListManager }           from "../../components/chipListManager.js";
import { loadItemDefinitions }             from "../../../services/itemDefinitionsService.js";

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

  // ─── Pickr wiring ──────────────────────────────────────────────
  // now includes name + description
  const pickrs = initFormPickrs(form, {
    name:        fields.colorName,
    description: fields.colorDesc
  });

  // Prepare items for loot-pool labels
  let itemMap = [];
  async function ensureAllItems() {
    if (!itemMap.length) {
      itemMap = await loadItemDefinitions(db);
    }
  }

  // Shared chip-list manager for loot-pool
  const chipManager = createChipListManager({
    container:   fields.chipContainer,
    listArray:   fields.lootPool,
    renderLabel: id => {
      const def = itemMap.find(i => i.id === id) || { name: id };
      return def.name;
    },
    onChange:    () => onFieldChange?.(getCustom())
  });

  // Loot-pool picker button
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

  // ─── Internal state & payload ────────────────────────────────
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

  // ─── Shared reset & populate ────────────────────────────────
  const { reset: _reset, populate: _populate } = createFormState({
    form,
    fields: {
      name:        fields.fldName,
      category:    fields.fldCategory,
      size:        fields.fldSize,
      description: fields.fldDesc
    },
    defaultFieldKeys: ["name","description"],
    defaultValues:    { size: "Small", category: "Normal" },
    pickrs,
    pickrClearKeys:   ["name","description"],
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
    chipManager.render();
  }

  function populate(def) {
    _id = def.id || null;
    _populate(def);
    fields.extraInfo.setLines(def.extraLines||[], false);
    chipManager.render();
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

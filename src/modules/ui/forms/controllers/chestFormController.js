// @file: src/modules/ui/forms/controllers/chestFormController.js
// @version: 2.15 — fix extra-info populate ordering

import { getPickrHexColor }                       from "../../../utils/colorUtils.js";
import { createChestForm }                        from "../builders/chestFormBuilder.js";
import {
  createFormControllerHeader,
  wireFormEvents
}                                                 from "../../components/formControllerShell.js";
import { initFormPickrs }                         from "../../components/formPickrManager.js";
import { createFormState }                        from "../../components/formStateManager.js";
import { pickItems }                              from "../../components/listPicker.js";
import { loadItemDefinitions }                    from "../../../services/itemDefinitionsService.js";

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
      if (_id && confirm("Delete this chest type?")) {
        onDelete?.(_id);
      }
    }
  });
  setDeleteVisible(false);
  form.prepend(subheadingWrap);

  // Pickr wiring
  const pickrs = initFormPickrs(form, {
    description: fields.colorDesc
  });

  // Loot-pool picker
  let itemMap = [];
  async function ensureAllItems() {
    if (!itemMap.length) {
      itemMap = await loadItemDefinitions(db);
    }
  }
  function renderChips() {
    fields.chipContainer.innerHTML = "";
    fields.lootPool.forEach(id => {
      const def = itemMap.find(i => i.id === id) || { name: id };
      const chip = document.createElement("span");
      chip.className = "loot-pool-chip";
      chip.textContent = def.name;
      const x = document.createElement("span");
      x.className   = "remove-chip";
      x.textContent = "×";
      x.onclick     = () => {
        fields.lootPool.splice(fields.lootPool.indexOf(id), 1);
        renderChips();
        onFieldChange?.(getCustom());
      };
      chip.append(x);
      fields.chipContainer.append(chip);
    });
  }
  renderChips();

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
    renderChips();
    onFieldChange?.(getCustom());
  };

  // Internal state & payload
  let _id = null;
  function getCustom() {
    return {
      id:               _id,
      name:             fields.fldName.value.trim(),
      size:             fields.fldSize.value,
      category:         fields.fldCategory.value,
      iconUrl:          fields.fldIconUrl.value.trim(),
      subtext:          fields.fldSubtext.value.trim(),
      lootPool:         [...fields.lootPool],
      description:      fields.fldDesc.value.trim(),
      descriptionColor: getPickrHexColor(pickrs.description),
      extraLines:       fields.extraInfo.getLines()
    };
  }

  // Shared reset & populate
  const { reset: _reset, populate: _populate } = createFormState({
    form,
    fields: {
      name:        fields.fldName,
      size:        fields.fldSize,
      category:    fields.fldCategory,
      iconUrl:     fields.fldIconUrl,
      subtext:     fields.fldSubtext,
      description: fields.fldDesc
    },
    defaultFieldKeys: ["name", "description"],
    defaultValues:    { size: "Small", category: "Normal" },
    pickrs,
    pickrClearKeys:   ["description"],
    chipLists: [
      { fieldArray: fields.lootPool, renderFn: renderChips, defKey: "lootPool" }
    ],
    subheading,
    setDeleteVisible,
    addTitle:  "Add Chest Type",
    editTitle: "Edit Chest Type",
    getCustom,
    onFieldChange
  });

  // wrap reset/populate to include chip rendering & ID
  function reset() {
    _id = null;
    fields.extraInfo.setLines([], false);
    _reset();
    renderChips();
  }

  function populate(def) {
    _id = def.id || null;
    _populate(def);
    // **restore extra-info lines after core populate**
    fields.extraInfo.setLines(def.extraLines || [], false);
    renderChips();
  }

  // Wire submission & live-preview
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
        initFormPickrs(form, { description: fields.colorDesc })
      );
    }
  };
}
 
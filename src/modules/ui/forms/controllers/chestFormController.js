// @file: src/modules/ui/forms/controllers/chestFormController.js
// @version: 2.13 — use shared formLogic for reset/populate/getCustom

import { createChestForm }                        from "../builders/chestFormBuilder.js";
import {
  createFormControllerHeader,
  wireFormEvents
}                                                 from "../../components/formControllerShell.js";
import { initFormPickrs }                         from "../../components/formPickrManager.js";
import { pickItems }                              from "../../components/listPicker.js";
import { createFormLogic }                        from "../formLogicFactory.js";
import { loadItemDefinitions }                    from "../../../services/itemDefinitionsService.js";

/**
 * Chest‐definition form controller.
 */
export function createChestFormController(
  { onCancel, onSubmit, onDelete, onFieldChange },
  db
) {
  const { form, fields } = createChestForm();

  // ─── Shared header + buttons ─────────────────────────────────────
  const {
    container: subheadingWrap,
    subheading,
    setDeleteVisible
  } = createFormControllerHeader({
    title:     "Add Chest Type",
    hasFilter: false,
    onCancel:  () => {
      reset();
      onCancel?.();
    },
    onDelete:  () => {
      if (_id && confirm("Delete this chest type?")) {
        onDelete?.(_id);
      }
    }
  });
  setDeleteVisible(false);
  form.prepend(subheadingWrap);

  // ─── Shared Pickr wiring ─────────────────────────────────────────
  const pickrs = initFormPickrs(form, {
    description: fields.colorDesc
  });

  // ─── Loot‐pool picker & chips ────────────────────────────────────
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
    const chosen = await pickItems({
      title:    "Select Loot Pool Items",
      items:    itemMap,
      selected: fields.lootPool,
      labelKey: "name"
    });
    fields.lootPool.splice(0, fields.lootPool.length, ...chosen);
    renderChips();
    onFieldChange?.(getCustom());
  };

  // ─── Shared reset/populate/getCustom ─────────────────────────────
  const {
    reset: baseReset,
    populate: basePopulate,
    getCustom: baseGetCustom
  } = createFormLogic({
    form,
    fields,
    pickrs,
    // no checkboxField for chest
    extraInfoField: fields.extraInfo,
    properties: {
      // map form fields to definition props
      fieldProps: {
        fldName:     "name",
        fldSize:     "size",
        fldCategory: "category",
        fldIconUrl:  "iconUrl",
        fldSubtext:  "subtext",
        fldDesc:     "description"
      },
      pickrProps: {
        description: "descriptionColor"
      }
    },
    defaults: {
      fldSize:     "Small",
      fldCategory: "Normal"
    }
  });

  let _id = null;

  function reset() {
    baseReset();
    renderChips();
    subheading.textContent = "Add Chest Type";
    setDeleteVisible(false);
    onFieldChange?.(getCustom());
  }

  function populate(def) {
    basePopulate(def);
    _id = def.id || null;
    fields.lootPool.splice(0, fields.lootPool.length, ...(def.lootPool || []));
    renderChips();
    subheading.textContent = _id ? "Edit Chest Type" : "Add Chest Type";
    setDeleteVisible(!!_id);
    onFieldChange?.(getCustom());
  }

  function getCustom() {
    const out = baseGetCustom();
    out.lootPool = [...fields.lootPool];
    return out;
  }

  // ─── Wire submit & live‐preview events ───────────────────────────
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

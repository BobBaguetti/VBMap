// @file: src/modules/ui/forms/controllers/chestFormController.js
// @version: 2.12 — use shared listPicker for loot‐pool selection

import { getPickrHexColor }                          from "../../../utils/colorUtils.js";
import { createChestForm }                           from "../builders/chestFormBuilder.js";
import { createFormControllerHeader, wireFormEvents }from "../../components/formControllerShell.js";
import { initFormPickrs }                            from "../../components/formPickrManager.js";
import { pickItems }                                 from "../../components/listPicker.js";
import { loadItemDefinitions }                       from "../../../services/itemDefinitionsService.js";

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
    title:    "Add Chest Type",
    hasFilter: false,
    onCancel: () => onCancel?.(),
    onDelete: () => {
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

  // ─── Loot-pool picker (uses shared listPicker) ───────────────────
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

  // ─── Internal state ───────────────────────────────────────────────
  let _id = null;

  // ─── Reset / Add mode ─────────────────────────────────────────────
  function reset() {
    form.reset();
    _id = null;
    fields.lootPool.length = 0;
    renderChips();
    fields.fldSize.value     = "Small";
    fields.fldCategory.value = "Normal";
    subheading.textContent   = "Add Chest Type";
    setDeleteVisible(false);
    pickrs.description?.setColor("#E5E6E8");
    fields.extraInfo.setLines([], false);
    onFieldChange?.(getCustom());
  }

  // ─── Populate / Edit mode ─────────────────────────────────────────
  function populate(def) {
    form.reset();
    _id = def.id || null;
    fields.fldName.value        = def.name    || "";
    fields.fldSize.value        = def.size    || "Small";
    fields.fldCategory.value    = def.category|| "Normal";
    fields.fldIconUrl.value     = def.iconUrl || "";
    fields.fldSubtext.value     = def.subtext || "";
    fields.lootPool.splice(0, fields.lootPool.length, ...(def.lootPool||[]));
    renderChips();
    fields.fldDesc.value        = def.description || "";
    fields.extraInfo.setLines(def.extraLines || [], false);
    subheading.textContent      = _id ? "Edit Chest Type" : "Add Chest Type";
    setDeleteVisible(!!_id);
    pickrs.description?.setColor(def.descriptionColor);
    onFieldChange?.(getCustom());
  }

  // ─── Gather form data ─────────────────────────────────────────────
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

  // ─── Wire submit & live‐preview events ───────────────────────────
  wireFormEvents(form, getCustom, onSubmit, onFieldChange);

  return {
    form,
    reset,
    populate,
    getCustom,
    getCurrentPayload: getCustom,

    // For re-wiring Pickr after insertion
    initPickrs() {
      Object.assign(pickrs, initFormPickrs(form, {
        description: fields.colorDesc
      }));
    }
  };
}

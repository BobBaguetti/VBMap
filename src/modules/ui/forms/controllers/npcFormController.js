// @file: src/modules/ui/forms/controllers/npcFormController.js
// @version: 1.0 — controller for NPC definition form

import { getPickrHexColor } from "../../../utils/colorUtils.js";
import { createNPCForm } from "../builders/npcFormBuilder.js";
import {
  createFormControllerHeader,
  wireFormEvents
} from "../../components/formControllerShell.js";
import { initFormPickrs } from "../../components/formPickrManager.js";
import { createFormState }  from "../../components/formStateManager.js";
import { loadItemDefinitions } from "../../../services/itemDefinitionsService.js";

export function createNPCFormController(
  { onCancel, onSubmit, onDelete, onFieldChange },
  db
) {
  const { form, fields } = createNPCForm();

  // Header + filter toggle + delete button
  const {
    container: subheadingWrap,
    subheading,
    filterCheckbox: chkShow,
    setDeleteVisible
  } = createFormControllerHeader({
    title:     "Add NPC",
    hasFilter: true,
    onFilter:  () => onFieldChange?.(getPayload()),
    onCancel:  () => onCancel?.(),
    onDelete:  () => {
      if (_id && confirm("Delete this NPC?")) onDelete?.(_id);
    }
  });
  setDeleteVisible(false);
  form.prepend(subheadingWrap);

  // Pickr for any color fields (NPC has no explicit color fields except extras)
  const pickrs = initFormPickrs(form, {
    description: fields.colorDesc // assume colorDesc was added in builder if desired
  });

  // Load & seed items for Loot Table chip-list
  let itemMap = [];
  async function ensureItems() {
    if (!itemMap.length) {
      itemMap = await loadItemDefinitions(db);
      fields.lootItems.splice(0, fields.lootItems.length, ...itemMap);
    }
    return itemMap;
  }
  ensureItems().then(defs => {
    fields.setLoot(defs.filter(i => fields.getLoot().includes(i.id)));
  });

  // Internal state
  let _id = null;
  function getPayload() {
    return {
      id:              _id,
      showInFilters:   chkShow.checked,
      name:            fields.fldName.value.trim(),
      devName:         fields.fldDevName.value.trim(),
      description:     fields.fldDesc.value.trim(),
      iconSmall:       fields.fldImgS.value.trim(),
      iconLarge:       fields.fldImgL.value.trim(),
      isHostile:       fields.fldHostile.value === "true",
      health:          Number(fields.fldHealth.value),
      damage:          Number(fields.fldDamage.value),
      lootTable:       fields.getLoot().map(i => i.id),
      extraInfo:       fields.extraInfo.getLines()
    };
  }

  // Wire reset & populate
  const { reset: _reset, populate: _populate } = createFormState({
    form,
    fields: {
      name:        fields.fldName,
      devName:     fields.fldDevName,
      description: fields.fldDesc,
      iconSmall:   fields.fldImgS,
      iconLarge:   fields.fldImgL,
      isHostile:   fields.fldHostile,
      health:      fields.fldHealth,
      damage:      fields.fldDamage,
      showInFilters: fields.fldShowInFilters
    },
    defaultFieldKeys: ["name","devName","description","iconSmall","iconLarge","isHostile","health","damage"],
    pickrs,
    pickrClearKeys:   ["description"],
    subheading,
    setDeleteVisible,
    addTitle:  "Add NPC",
    editTitle: "Edit NPC",
    getCustom: getPayload,
    onFieldChange
  });

  function reset() {
    _id = null;
    chkShow.checked = true;
    fields.extraInfo.setLines([], false);
    fields.setLoot([]);
    _reset();
  }

  async function populate(def) {
    _id = def.id;
    _populate(def);
    chkShow.checked = !!def.showInFilters;
    fields.extraInfo.setLines(def.extraInfo || [], false);
    await ensureItems();
    fields.setLoot(itemMap.filter(i => def.lootTable.includes(i.id)));
  }

  // Wire form events
  wireFormEvents(form, getPayload, onSubmit, onFieldChange);

  return {
    form,
    reset,
    populate,
    getCustom: getPayload,
    getCurrentPayload: getPayload,
    initPickrs: () => initFormPickrs(form, { description: fields.colorDesc })
  };
}

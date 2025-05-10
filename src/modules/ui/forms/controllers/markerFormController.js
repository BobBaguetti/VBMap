// @file: src/modules/ui/forms/controllers/markerFormController.js
// @version: 1.1 — fix imports for chest definitions

import { getPickrHexColor }            from "../../../utils/colorUtils.js";
import { loadItemDefinitions }         from "../../../services/itemDefinitionsService.js";
import { loadChestDefinitions }        from "../../../services/chestDefinitionsService.js";
import {
  createFormControllerHeader,
  wireFormEvents
}                                       from "../../components/formControllerShell.js";
import { initFormPickrs }              from "../../components/formPickrManager.js";
import { createMarkerFormBuilder }     from "../builders/markerFormBuilder.js";

/**
 * Controller around the marker form:
 *  • loads & caches item/chest defs
 *  • wires the “Type” dropdown to show/hide the right fields
 *  • handles Pickr & live‐preview events
 *
 * @param {{
 *   onCancel?:     () => void,
 *   onSubmit:      (payload: object) => void,
 *   onFieldChange?: (payload: object) => void
 * }} callbacks
 * @param {firebase.firestore.Firestore} db
 */
export function createMarkerFormController(
  { onCancel, onSubmit, onFieldChange },
  db
) {
  const { form, fields } = createMarkerFormBuilder();

  // ─── Header row ──────────────────────────────────────────────
  const { container: headerWrap, subheading, setDeleteVisible } =
    createFormControllerHeader({
      title:     "Place Marker",
      hasFilter: false,
      onCancel:  () => onCancel?.()
    });
  setDeleteVisible(false);
  form.prepend(headerWrap);

  // ─── Cached definitions ──────────────────────────────────────
  let itemDefs  = [];
  let chestDefs = [];
  async function refreshDefs() {
    [ itemDefs, chestDefs ] = await Promise.all([
      loadItemDefinitions(db),
      loadChestDefinitions(db)
    ]);
  }

  // ─── Type‐switching logic ────────────────────────────────────
  fields.fldType       = form.querySelector("#marker-fld-type");
  fields.fldPredefItem = form.querySelector("#marker-fld-predef-item");
  fields.fldChestType  = form.querySelector("#marker-fld-predef-chest");

  function updateVisibility() {
    const t = fields.fldType.value;
    fields.fldPredefItem.closest(".field-row").style.display = t === "Item"  ? "flex" : "none";
    fields.fldChestType .closest(".field-row").style.display = t === "Chest" ? "flex" : "none";
    fields.extraRow.style.display                       = t !== ""       ? "flex" : "none";
  }
  fields.fldType.addEventListener("change", updateVisibility);

  // ─── Populate preload dropdowns ─────────────────────────────
  async function populateDropdowns() {
    const pd = fields.fldPredefItem;
    pd.innerHTML = `<option value="">None (custom)</option>`;
    itemDefs.forEach(d => pd.insertAdjacentHTML(
      "beforeend",
      `<option value="${d.id}">${d.name}</option>`
    ));

    const pc = fields.fldChestType;
    pc.innerHTML = `<option value="">Select Chest Type</option>`;
    chestDefs.forEach(d => pc.insertAdjacentHTML(
      "beforeend",
      `<option value="${d.id}">${d.name}</option>`
    ));
  }

  fields.fldPredefItem.addEventListener("change", () => {
    const def = itemDefs.find(d => d.id === fields.fldPredefItem.value) || {};
    formApi.setFromDefinition(def);
    formApi.initPickrs();
    onFieldChange?.(getCustom());
  });

  // ─── Builder wiring ─────────────────────────────────────────
  const formApi = { 
    ...createMarkerFormBuilder(),
    form, 
    fields 
  };

  // ─── Pickr wiring ────────────────────────────────────────────
  const pickrs = initFormPickrs(form, {
    name:        fields.colorName,
    rarity:      fields.colorRarity,
    itemType:    fields.colorItemType,
    description: fields.colorDesc
  });

  // ─── Payload maker ───────────────────────────────────────────
  function getCustom() {
    const base = {
      name:             fields.fldName.value.trim(),
      nameColor:        getPickrHexColor(pickrs.name),
      description:      fields.fldDesc.value.trim(),
      descriptionColor: getPickrHexColor(pickrs.description),
      extraLines:       fields.extraInfo.getLines(),
      imageSmall:       fields.fldImgS.value.trim(),
      imageBig:         fields.fldImgL.value.trim(),
      video:            fields.fldVid.value.trim()
    };

    if (fields.fldType.value === "Item" && fields.fldPredefItem.value) {
      return {
        type:             "Item",
        predefinedItemId: fields.fldPredefItem.value,
        ...base,
        ...formApi.getCustom()
      };
    } else if (fields.fldType.value === "Chest" && fields.fldChestType.value) {
      return {
        type:        "Chest",
        chestTypeId: fields.fldChestType.value,
        ...base
      };
    }

    return {
      type: fields.fldType.value || "Custom",
      ...base
    };
  }

  // ─── Reset & populate ────────────────────────────────────────
  form.reset = () => {
    formApi.setFromDefinition({});
    fields.fldType.value          = "";
    fields.fldPredefItem.value    = "";
    fields.fldChestType.value     = "";
    updateVisibility();
    pickrs.name.setColor("");
  };

  form.populate = async data => {
    await refreshDefs();
    await populateDropdowns();
    fields.fldType.value       = data.type;
    fields.fldPredefItem.value = data.predefinedItemId || "";
    fields.fldChestType.value  = data.chestTypeId    || "";
    formApi.setFromDefinition(data);
    updateVisibility();
    pickrs.name.setColor(data.nameColor);
  };

  wireFormEvents(form, getCustom, onSubmit, onFieldChange);

  // initial load
  refreshDefs().then(populateDropdowns);

  return {
    form,
    reset:      form.reset,
    populate:   form.populate,
    initPickrs: () => initFormPickrs(form, {
      name:        fields.colorName,
      rarity:      fields.colorRarity,
      itemType:    fields.colorItemType,
      description: fields.colorDesc
    }),
    getCustom,
    getCurrentPayload: getCustom
  };
}

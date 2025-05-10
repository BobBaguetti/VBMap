// @file: src/modules/ui/forms/controllers/markerFormController.js
// @version: 1.2 — query type/select elements by ID instead of inside builder form

import { getPickrHexColor }         from "../../../utils/colorUtils.js";
import { loadItemDefinitions }      from "../../../services/itemDefinitionsService.js";
import { loadChestDefinitions }     from "../../../services/chestDefinitionsService.js";
import {
  createFormControllerHeader,
  wireFormEvents
}                                    from "../../components/formControllerShell.js";
import { initFormPickrs }           from "../../components/formPickrManager.js";
import { createMarkerFormBuilder }  from "../builders/markerFormBuilder.js";

export function createMarkerFormController(
  { onCancel, onSubmit, onFieldChange },
  db
) {
  // Build the form fields
  const { form, fields } = createMarkerFormBuilder();

  // Header/Cancel wiring
  const { container: headerWrap, setDeleteVisible } =
    createFormControllerHeader({
      title:     "Place Marker",
      hasFilter: false,
      onCancel:  () => onCancel?.()
    });
  setDeleteVisible(false);
  form.prepend(headerWrap);

  // Cached definitions
  let itemDefs = [], chestDefs = [];
  async function refreshDefs() {
    [ itemDefs, chestDefs ] = await Promise.all([
      loadItemDefinitions(db),
      loadChestDefinitions(db)
    ]);
  }

  // Type‐switching selects are outside the builder form
  fields.fldType       = document.getElementById("fld-type");
  fields.fldPredefItem = document.getElementById("fld-predef-item");
  fields.fldChestType  = document.getElementById("fld-predef-chest");

  function updateVisibility() {
    const t = fields.fldType.value;
    fields.fldPredefItem.closest(".field-row").style.display = t === "Item"  ? "flex" : "none";
    fields.fldChestType .closest(".field-row").style.display = t === "Chest" ? "flex" : "none";
    fields.extraRow.style.display                         = t !== ""       ? "flex" : "none";
  }
  fields.fldType.addEventListener("change", updateVisibility);

  // Populate the “predef” dropdowns
  async function populateDropdowns() {
    const pd = fields.fldPredefItem;
    pd.innerHTML = `<option value="">None (custom)</option>`;
    itemDefs.forEach(d => 
      pd.insertAdjacentHTML("beforeend", `<option value="${d.id}">${d.name}</option>`)
    );

    const pc = fields.fldChestType;
    pc.innerHTML = `<option value="">Select Chest Type</option>`;
    chestDefs.forEach(d =>
      pc.insertAdjacentHTML("beforeend", `<option value="${d.id}">${d.name}</option>`)
    );
  }

  // When user picks a predefined Item, autofill builder fields
  // (uses the builder's setFromDefinition)
  const formApi = {
    ...createMarkerFormBuilder(),
    form,
    fields
  };
  fields.fldPredefItem.addEventListener("change", () => {
    const def = itemDefs.find(d => d.id === fields.fldPredefItem.value) || {};
    formApi.setFromDefinition(def);
    formApi.initPickrs();
    onFieldChange?.(getCustom());
  });

  // Pickr wiring
  const pickrs = initFormPickrs(form, {
    name:        fields.colorName,
    rarity:      fields.colorRarity,
    itemType:    fields.colorItemType,
    description: fields.colorDesc
  });

  // Payload composer
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

    return { type: fields.fldType.value || "Custom", ...base };
  }

  // Reset & populate methods
  form.reset = () => {
    formApi.setFromDefinition({});
    fields.fldType.value       = "";
    fields.fldPredefItem.value = "";
    fields.fldChestType.value  = "";
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

  // Wire events: input → onFieldChange, submit → onSubmit
  wireFormEvents(form, getCustom, onSubmit, onFieldChange);

  // Initial load of definitions & dropdowns
  refreshDefs().then(populateDropdowns);

  return {
    form,
    reset:        form.reset,
    populate:     form.populate,
    initPickrs:   () => Object.assign(
      pickrs,
      initFormPickrs(form, {
        name:        fields.colorName,
        rarity:      fields.colorRarity,
        itemType:    fields.colorItemType,
        description: fields.colorDesc
      })
    ),
    getCustom,
    getCurrentPayload: getCustom
  };
}

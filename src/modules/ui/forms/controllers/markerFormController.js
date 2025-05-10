// @file: src/modules/ui/forms/controllers/markerFormController.js
// @version: 1.2 — strip out type/predef logic; focus on builder fields

import { getPickrHexColor }            from "../../../utils/colorUtils.js";
import {
  createFormControllerHeader,
  wireFormEvents
}                                       from "../../components/formControllerShell.js";
import { initFormPickrs }              from "../../components/formPickrManager.js";
import { createMarkerFormBuilder }     from "../builders/markerFormBuilder.js";

/**
 * Controller for the marker form builder fields:
 *  • headers & cancel button
 *  • pickr wiring
 *  • getCustom() & setFromDefinition()
 *  • form reset/populate
 *  • onSubmit/onFieldChange hooks
 *
 * @param {{
 *   onCancel?:     () => void,
 *   onSubmit:      (payload: object) => void,
 *   onFieldChange?: (payload: object) => void
 * }} callbacks
 */
export function createMarkerFormController(
  { onCancel, onSubmit, onFieldChange },
) {
  // build the form fields
  const { form, fields } = createMarkerFormBuilder();

  // Header + Cancel (no delete)
  const { container: headerWrap, subheading, setDeleteVisible } =
    createFormControllerHeader({
      title:     "Marker Details",
      hasFilter: false,
      onCancel:  () => onCancel?.()
    });
  setDeleteVisible(false);
  form.prepend(headerWrap);

  // Initialize Pickr on builder color buttons
  const pickrs = initFormPickrs(form, {
    name:        fields.colorName,
    rarity:      fields.colorRarity,
    itemType:    fields.colorItemType,
    description: fields.colorDesc
  });

  // Extract values from the builder fields into a payload
  function getCustom() {
    return {
      name:              fields.fldName.value.trim(),
      nameColor:         getPickrHexColor(pickrs.name),
      rarity:            fields.fldRarity.value,
      rarityColor:       getPickrHexColor(pickrs.rarity),
      itemType:          fields.fldItemType.value,
      itemTypeColor:     getPickrHexColor(pickrs.itemType),
      description:       fields.fldDesc.value.trim(),
      descriptionColor:  getPickrHexColor(pickrs.description),
      extraLines:        fields.extraInfo.getLines(),
      imageSmall:        fields.fldImgS.value.trim(),
      imageBig:          fields.fldImgL.value.trim(),
      video:             fields.fldVid.value.trim()
    };
  }

  // Populate builder fields from a definition object
  function setFromDefinition(def = {}) {
    fields.fldName.value        = def.name || "";
    pickrs.name.setColor(def.nameColor || "#E5E6E8");

    fields.fldRarity.value      = def.rarity || "";
    pickrs.rarity.setColor(def.rarityColor || "#E5E6E8");

    fields.fldItemType.value    = def.itemType || "";
    pickrs.itemType.setColor(def.itemTypeColor || "#E5E6E8");

    fields.fldDesc.value        = def.description || "";
    pickrs.description.setColor(def.descriptionColor || "#E5E6E8");

    fields.extraInfo.setLines(def.extraLines || [], false);

    fields.fldImgS.value        = def.imageSmall || "";
    fields.fldImgL.value        = def.imageBig || "";
    fields.fldVid.value         = def.video || "";
  }

  // Wire up form events to onSubmit and onFieldChange
  wireFormEvents(form, getCustom, onSubmit, onFieldChange);

  // Extend form with reset() and populate()
  form.reset = () => {
    setFromDefinition({});
  };
  form.populate = def => {
    setFromDefinition(def);
  };

  // Expose API
  return {
    form,
    reset:          form.reset,
    populate:       form.populate,
    initPickrs:     () => initFormPickrs(form, {
      name:        fields.colorName,
      rarity:      fields.colorRarity,
      itemType:    fields.colorItemType,
      description: fields.colorDesc
    }),
    getCustom,
    setFromDefinition
  };
}

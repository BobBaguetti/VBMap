// @file: src/modules/ui/forms/builders/markerFormBuilder.js
// @version: 1.0 — purely builds the marker form DOM

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createVideoField,
  createFieldRow
} from "../../components/uiKit/fieldKit.js";
import { createExtraInfoBlock } from "../../components/uiKit/extraInfoBlock.js";
import { createItemForm }       from "./itemFormBuilder.js";   // reuse your itemFormBuilder
import { createChestForm }      from "./chestFormBuilder.js";  // reuse your chestFormBuilder

export function createMarkerFormBuilder() {
  const form = document.createElement("form");
  form.id = "marker-form";

  // — Name —
  const { row: rowName, input: fldName, colorBtn: colorName } =
    createTextField("Name:", "marker-fld-name");
  colorName.id = "marker-fld-name-color";

  // — Type —
  const { row: rowType, select: fldType } = createDropdownField(
    "Type:", "marker-fld-type",
    [
      { value: "",                label: "Select type…" },
      { value: "Door",            label: "Door" },
      { value: "Extraction Portal", label: "Extraction Portal" },
      { value: "Item",            label: "Item" },
      { value: "Chest",           label: "Chest" },
      { value: "Teleport",        label: "Teleport" },
      { value: "Spawn Point",     label: "Spawn Point" }
    ],
    { showColor: false }
  );

  // — Predefined Item / Chest Type placeholders —
  const { row: rowPredefItem, select: fldPredefItem } =
    createDropdownField("Item:", "marker-fld-predef-item", [], { showColor: false });
  const { row: rowChestType, select: fldChestType } =
    createDropdownField("Chest Type:", "marker-fld-predef-chest", [], { showColor: false });

  // — Sub‐forms for “full” Item or Chest editing —  
  //    these come from your itemFormBuilder & chestFormBuilder
  const itemFormBlock  = createItemForm();
  const chestFormBlock = createChestForm();

  // wrap each in a container so we can show/hide
  const itemContainer  = document.createElement("div");
  itemContainer.classList.add("marker-subform-block");
  itemContainer.appendChild(itemFormBlock.form);

  const chestContainer = document.createElement("div");
  chestContainer.classList.add("marker-subform-block");
  chestContainer.appendChild(chestFormBlock.form);

  // — Extra Info & Media (common to all) —
  const extraInfo = createExtraInfoBlock({ withDividers: true });
  const rowExtra  = createFieldRow("Extra Info:", extraInfo.block);
  const { row: rowImgS, input: fldImgS } = createImageField("Image S:", "marker-fld-img-s");
  const { row: rowImgL, input: fldImgL } = createImageField("Image L:", "marker-fld-img-l");
  const { row: rowVid, input: fldVid }   = createVideoField("Video:", "marker-fld-vid");

  // — Buttons will be added by the controller/modal —  
  // Now assemble in order:
  form.append(
    rowName,
    rowType,
    rowPredefItem,
    rowChestType,
    itemContainer,
    chestContainer,
    rowExtra,
    rowImgS,
    rowImgL,
    rowVid
  );

  return {
    form,
    fields: {
      fldName, colorName,
      fldType,
      fldPredefItem, rowPredefItem,
      fldChestType,  rowChestType,
      extraInfo, rowExtra,
      fldImgS, fldImgL, fldVid
    },
    blocks: {
      item:  { container: itemContainer, fields: itemFormBlock.fields, init: itemFormBlock.initPickrs, setFromDef: itemFormBlock.setFromDefinition, getCustom: itemFormBlock.getCustom },
      chest: { container: chestContainer, fields: chestFormBlock.fields, init: chestFormBlock.initPickrs, setFromDef: chestFormBlock.setFromNonItem, getCustom: chestFormBlock.getCustom }
    }
  };
}

// @version: 26
// @file: /scripts/modules/ui/modals/markerForm.js

import { createModal, closeModal } from "../uiKit.js";
import { loadItemDefinitions } from "../../services/itemDefinitionsService.js";
import {
  createTextField,
  createDropdownField,
  createFieldRow,
  createTextareaFieldWithColor,
  createImageField,
  createVideoField,
  createExtraInfoBlock,
  createFormButtonRow
} from "../uiKit.js";
import { createPickr } from "../pickrManager.js";

export function initMarkerForm(db) {
  // 1) Create modal
  const { modal, content } = createModal({
    id: "edit-marker-modal",
    title: "Edit Marker",
    size: "small",
    backdrop: false,
    draggable: true,
    onClose: () => closeModal(modal)
  });

  // 2) Divider under header
  content.appendChild(document.createElement("hr"));

  // 3) Form container
  const form = document.createElement("form");
  form.id = "edit-form";
  content.appendChild(form);

  // — Name field —
  const { row: rowName, input: fldName } = createTextField("Name:", "fld-name");
  fldName.classList.add("ui-input");

  // — Type dropdown (we hide its pickr but leave the btn in the DOM) —
  const { row: rowType, select: fldType, colorBtn: pickrTypeBtn } =
    createDropdownField("Type:", "fld-type", [
      { value: "Door", label: "Door" },
      { value: "Extraction Portal", label: "Extraction Portal" },
      { value: "Item", label: "Item" },
      { value: "Teleport", label: "Teleport" },
      { value: "Spawn Point", label: "Spawn points" }
    ]);
  fldType.classList.add("ui-input");
  pickrTypeBtn.style.visibility = "hidden";

  // — Predefined‑item dropdown (leave its hidden pickr btn) —
  const { row: rowPre, select: ddPre, colorBtn: pickrPreBtn } =
    createDropdownField("Item:", "fld-predef", []);
  ddPre.classList.add("ui-input");
  pickrPreBtn.style.visibility = "hidden";

  // — Item‑specific fields with pickrs —
  const { row: rowRarity, select: fldRarity } =
    createDropdownField("Rarity:", "fld-rarity", [
      { value: "",          label: "Select Rarity" },
      { value: "common",    label: "Common"         },
      { value: "uncommon",  label: "Uncommon"       },
      { value: "rare",      label: "Rare"           },
      { value: "epic",      label: "Epic"           },
      { value: "legendary", label: "Legendary"      }
    ]);

  const { row: rowItemType, select: fldItemType } =
    createDropdownField("Item Type:", "fld-item-type", [
      { value: "Crafting Material", label: "Crafting Material" },
      { value: "Special",           label: "Special"           },
      { value: "Consumable",        label: "Consumable"        },
      { value: "Quest",             label: "Quest"             }
    ]);

  const { row: rowDescItem, textarea: fldDescItem } =
    createTextareaFieldWithColor("Description:", "fld-desc-item");

  // — Non‑item description with pickr —
  const { row: rowDescNI, textarea: fldDescNI } =
    createTextareaFieldWithColor("Description:", "fld-desc-nonitem");

  // — Image & video fields —
  const { row: rowImgS, input: fldImgS } = createImageField("Image S:", "fld-img-s");
  const { row: rowImgL, input: fldImgL } = createImageField("Image L:", "fld-img-l");
  const { row: rowVid, input: fldVid }   = createVideoField("Video:", "fld-vid");

  // — Extra Info block —
  const { block: extraInfoBlock, getLines, setLines } = createExtraInfoBlock();
  const rowExtra = document.createElement("div");
  rowExtra.className = "field-row extra-row";
  const lblExtra = document.createElement("label");
  lblExtra.textContent = "Extra Info:";
  rowExtra.append(lblExtra, extraInfoBlock);

  // 4) Dividers around Extra Info
  const hrBeforeExtra = document.createElement("hr");
  const hrAfterExtra  = document.createElement("hr");

  // — Save/Cancel buttons —
  const rowButtons = createFormButtonRow(() => closeModal(modal));

  // 5) Assemble item vs non‑item sections
  const blockItem = document.createElement("div");
  blockItem.append(
    rowRarity,
    rowItemType,
    rowDescItem,
    hrBeforeExtra,
    rowExtra,
    hrAfterExtra
  );
  const blockNI = document.createElement("div");
  blockNI.append(rowDescNI);

  // 6) Build out the form
  form.append(
    rowName,
    rowType,
    rowPre,
    blockItem,
    blockNI,
    rowImgS,
    rowImgL,
    rowVid,
    rowButtons
  );

  // 7) Add modal to DOM
  document.body.appendChild(modal);

  // 8) Instantiate color pickrs
  const pickrName     = createPickr("#fld-name-color");
  const pickrRare     = createPickr("#fld-rarity-color");
  const pickrItemType = createPickr("#fld-item-type-color");
  const pickrDescItem = createPickr("#fld-desc-item-color");
  const pickrDescNI   = createPickr("#fld-desc-nonitem-color");

  // 9) State & helpers (unchanged)…
  let defs = {}, customMode = false;
  function toggleSections(isItem) { /* … */ }
  async function refreshPredefinedItems() { /* … */ }
  function populateForm(data) { /* … */ }
  function harvestForm(coords) { /* … */ }
  function positionAtCursor(evt) { /* … */ }
  let submitCB;
  function openEdit(markerObj, data, evt, onSave) { /* … */ }
  function openCreate(coords, type, evt, onCreate) { /* … */ }

  return { openEdit, openCreate, refreshPredefinedItems };
}

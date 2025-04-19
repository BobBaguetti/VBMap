// @fullfile: Send the entire file, no omissions or abridgments.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 5
// @file:    /scripts/modules/ui/modals/markerForm.js

import { makeDraggable, positionModal } from "../uiManager.js";
import {
  loadItemDefinitions,
  addItemDefinition
} from "../../services/itemDefinitionsService.js";
import { deepClone } from "../../utils/utils.js";
import { createModal, createFieldRow, openModal, closeModal } from "../ui/uiKit.js";

export function initMarkerForm(db) {
  // ---------- Modal Setup ----------
  const { modal, content } = createModal({
    id: "edit-marker-modal",
    title: "Edit Marker",
    onClose: () => modal.style.display = "none"
  });

  const form = document.createElement("form");
  form.id = "edit-form";
  content.appendChild(form);

  // ---------- Field Definitions ----------
  const fldName   = document.createElement("input");
  const fldType   = document.createElement("select");
  const fldImgS   = document.createElement("input");
  const fldImgL   = document.createElement("input");
  const fldVid    = document.createElement("input");
  const fldRare   = document.createElement("select");
  const fldIType  = document.createElement("select");
  const fldDescIt = document.createElement("textarea");
  const fldDescNI = document.createElement("textarea");
  const ddPre     = document.createElement("select");

  fldName.id   = "edit-name";
  fldType.id   = "edit-type";
  fldImgS.id   = "edit-image-small";
  fldImgL.id   = "edit-image-big";
  fldVid.id    = "edit-video-url";
  fldRare.id   = "edit-rarity";
  fldIType.id  = "edit-item-type";
  fldDescIt.id = "edit-description";
  fldDescNI.id = "edit-description-non-item";
  ddPre.id     = "predefined-item-dropdown";

  fldType.innerHTML = `
    <option value="Door">Door</option>
    <option value="Extraction Portal">Extraction Portal</option>
    <option value="Item">Item</option>
    <option value="Teleport">Teleport</option>
    <option value="Spawn Point">Spawn points</option>
  `;

  fldRare.innerHTML = `
    <option value="">Select Rarity</option>
    <option value="common">Common</option>
    <option value="uncommon">Uncommon</option>
    <option value="rare">Rare</option>
    <option value="epic">Epic</option>
    <option value="legendary">Legendary</option>
  `;

  fldIType.innerHTML = `
    <option value="Crafting Material">Crafting Material</option>
    <option value="Special">Special</option>
    <option value="Consumable">Consumable</option>
    <option value="Quest">Quest</option>
  `;

  // Field container helpers
  const rowName      = createFieldRow("Name:", fldName);
  const rowType      = createFieldRow("Type:", fldType);
  const rowPreItem   = createFieldRow("Item:", ddPre);
  const rowRarity    = createFieldRow("Rarity:", fldRare);
  const rowItemType  = createFieldRow("Item Type:", fldIType);
  const rowDescItem  = createFieldRow("Description:", fldDescIt);
  const rowDescNon   = createFieldRow("Description:", fldDescNI);
  const rowImageS    = createFieldRow("Image S:", fldImgS);
  const rowImageL    = createFieldRow("Image L:", fldImgL);
  const rowVideo     = createFieldRow("Video:", fldVid);

  // Optional field groups
  const blockItem    = document.createElement("div");
  const blockNI      = document.createElement("div");
  const blockPre     = rowPreItem;
  const wrapLines    = document.createElement("div");

  blockItem.id       = "item-extra-fields";
  blockNI.id         = "non-item-description";
  blockPre.id        = "predefined-item-container";
  wrapLines.id       = "extra-lines";

  // Add Extra Info button
  const btnAddLine   = document.createElement("button");
  btnAddLine.type    = "button";
  btnAddLine.id      = "add-extra-line";
  btnAddLine.textContent = "+";
  btnAddLine.classList.add("ui-button");
  const extraRow     = createFieldRow("Extra Info:", btnAddLine);

  // Save + Cancel
  const rowButtons = document.createElement("div");
  rowButtons.style.justifyContent = "center";
  rowButtons.style.marginTop = "10px";
  rowButtons.classList.add("field-row");

  const btnSave = document.createElement("button");
  btnSave.type = "submit";
  btnSave.textContent = "Save";
  btnSave.classList.add("ui-button");

  const btnCancel = document.createElement("button");
  btnCancel.type = "button";
  btnCancel.textContent = "Cancel";
  btnCancel.classList.add("ui-button");

  rowButtons.append(btnSave, btnCancel);

  // Append form sections
  form.append(
    rowName,
    rowType,
    rowPreItem,
    blockItem,
    blockNI,
    rowImageS,
    rowImageL,
    rowVideo,
    rowButtons
  );

  blockItem.append(
    rowRarity,
    rowItemType,
    rowDescItem,
    document.createElement("hr"),
    extraRow,
    wrapLines,
    document.createElement("hr")
  );

  blockNI.append(rowDescNon, document.createElement("hr"));

  // Add to document
  document.body.appendChild(modal);

  // TODO: wire up remaining logic (pickers, validation, form submit, etc.)
  // We’ll continue here when you're ready.

  return {
    openEdit: () => openModal(modal),
    openCreate: () => openModal(modal),
    refreshPredefinedItems: () => {}
  };
}

// @version: 4

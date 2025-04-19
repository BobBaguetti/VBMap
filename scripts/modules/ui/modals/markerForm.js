// @version: 13
// @file: /scripts/modules/ui/modals/markerForm.js

import { positionModal } from "../uiManager.js";
import {
  loadItemDefinitions
} from "../../services/itemDefinitionsService.js";

import {
  createModal,
  openModal,
  closeModal,
  makeModalDraggable,
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createVideoField,
  createExtraInfoBlock,
  createFormFooter,
  createModalHeader
} from "../uiKit.js";

import { createPickr } from "../pickrManager.js"; 


export function initMarkerForm(db) {
  const { modal, content } = createModal({
    id: "edit-marker-modal",
    size: "small"
  });

  const header = createModalHeader("Edit Marker", () => closeModal(modal));
  content.appendChild(header);
  makeModalDraggable(modal, header);

  const form = document.createElement("form");
  form.id = "edit-form";
  content.appendChild(form);

  // ------------------------------
  // Field Setup using uiKit.js
  // ------------------------------

  const { row: rowName, input: fldName } = createTextField("Name:", "fld-name");
  const { row: rowRarity, select: fldRarity } = createDropdownField("Rarity:", "fld-rarity", []);
  const { row: rowItemType, select: fldItemType } = createDropdownField("Item Type:", "fld-item-type", []);
  const { row: rowDescItem, textarea: fldDescItem } = createTextareaFieldWithColor("Description:", "fld-desc-item");
  const { row: rowDescNI, textarea: fldDescNI } = createTextareaFieldWithColor("Description:", "fld-desc-nonitem");  

  const { row: rowImgS, input: fldImgS } = createImageField("Image S:", "fld-img-s");
  const { row: rowImgL, input: fldImgL } = createImageField("Image L:", "fld-img-l");
  const { row: rowVid,  input: fldVid  } = createVideoField("Video:", "fld-vid");

  const { block: extraInfoBlock, getLines, setLines } = createExtraInfoBlock();
  const rowExtra = document.createElement("div");
  rowExtra.className = "field-row";
  const lblExtra = document.createElement("label");
  lblExtra.textContent = "Extra Info:";
  rowExtra.appendChild(lblExtra);
  rowExtra.appendChild(extraInfoBlock);

  const fldType = document.createElement("select");
  fldType.id = "fld-type";
  const rowType = document.createElement("div");
  rowType.className = "field-row";
  const lblType = document.createElement("label");
  lblType.textContent = "Type:";
  lblType.htmlFor = "fld-type";
  rowType.appendChild(lblType);
  rowType.appendChild(fldType);

  const ddPre = document.createElement("select");
  ddPre.id = "fld-predef";
  const rowPre = document.createElement("div");
  rowPre.className = "field-row";
  const lblPre = document.createElement("label");
  lblPre.textContent = "Item:";
  rowPre.appendChild(lblPre);
  rowPre.appendChild(ddPre);

  const rowButtons = createFormFooter(() => closeModal(modal));

  // Group containers
  const blockItem = document.createElement("div");
  const blockNI   = document.createElement("div");

  blockItem.append(
    rowRarity,
    rowItemType,
    rowDescItem,
    document.createElement("hr"),
    rowExtra,
    document.createElement("hr")
  );
  blockNI.append(rowDescNI, document.createElement("hr"));

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

  document.body.appendChild(modal);


  const pickrName     = createPickr("#fld-name-color");
  const pickrRare     = createPickr("#fld-rarity-color");
  const pickrItemType = createPickr("#fld-item-type-color");
  const pickrDescItem = createPickr("#fld-desc-item-color");
  const pickrDescNI   = createPickr("#fld-desc-nonitem-color");

  // ------------------------------
  // Dropdown Setup
  // ------------------------------
  fldType.innerHTML = `
    <option value="Door">Door</option>
    <option value="Extraction Portal">Extraction Portal</option>
    <option value="Item">Item</option>
    <option value="Teleport">Teleport</option>
    <option value="Spawn Point">Spawn points</option>
  `;
  fldRarity.innerHTML = `
    <option value="">Select Rarity</option>
    <option value="common">Common</option>
    <option value="uncommon">Uncommon</option>
    <option value="rare">Rare</option>
    <option value="epic">Epic</option>
    <option value="legendary">Legendary</option>
  `;
  fldItemType.innerHTML = `
    <option value="Crafting Material">Crafting Material</option>
    <option value="Special">Special</option>
    <option value="Consumable">Consumable</option>
    <option value="Quest">Quest</option>
  `;

  // ------------------------------
  // State + Toggle Handling
  // ------------------------------
  let defs = {};
  let customMode = false;

  function toggleSections(isItem) {
    blockItem.style.display = isItem ? "block" : "none";
    blockNI.style.display   = isItem ? "none"  : "block";
    rowPre.style.display    = isItem ? "block" : "none";
  }

  fldType.onchange = () => {
    toggleSections(fldType.value === "Item");
  };

  async function refreshPredefinedItems() {
    const list = await loadItemDefinitions(db);
    defs = Object.fromEntries(list.map(d => [d.id, d]));
    ddPre.innerHTML = `<option value="">None (custom)</option>`;
    list.forEach(d => {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.name;
      ddPre.appendChild(o);
    });
  }

  function populateForm(data = { type: "Item" }) {
    fldType.value = data.type;
    toggleSections(data.type === "Item");

    if (data.type === "Item") {
      if (data.predefinedItemId && defs[data.predefinedItemId]) {
        const def = defs[data.predefinedItemId];
        ddPre.value = def.id;
        fldName.value = def.name;
        pickrName.setColor(def.nameColor || "#E5E6E8");
        fldRarity.value = def.rarity;
        pickrRare.setColor(def.rarityColor || "#E5E6E8");
        fldItemType.value = def.itemType || def.type;
        pickrItemType.setColor(def.itemTypeColor || "#E5E6E8");
        fldDescItem.value = def.description;
        pickrDescItem.setColor(def.descriptionColor || "#E5E6E8");
        fldImgS.value = def.imageSmall;
        fldImgL.value = def.imageBig;
        fldVid.value = "";
        setLines(def.extraLines || [], true);
        customMode = false;
      } else {
        ddPre.value = "";
        fldName.value = "";
        pickrName.setColor("#E5E6E8");
        fldRarity.value = "";
        pickrRare.setColor("#E5E6E8");
        fldItemType.value = "";
        pickrItemType.setColor("#E5E6E8");
        fldDescItem.value = "";
        pickrDescItem.setColor("#E5E6E8");
        fldImgS.value = "";
        fldImgL.value = "";
        fldVid.value = "";
        setLines([], false);
        customMode = true;
      }
    } else {
      fldName.value = data.name || "";
      pickrName.setColor(data.nameColor || "#E5E6E8");
      fldImgS.value = data.imageSmall || "";
      fldImgL.value = data.imageBig || "";
      fldVid.value = data.videoURL || "";
      fldDescNI.value = data.description || "";
      pickrDescNI.setColor(data.descriptionColor || "#E5E6E8");
    }
  }

  function harvestForm(coords) {
    const out = { type: fldType.value, coords };

    if (out.type === "Item") {
      if (!customMode) {
        const d = defs[ddPre.value];
        Object.assign(out, {
          predefinedItemId: d.id,
          name:             d.name,
          nameColor:        d.nameColor,
          rarity:           d.rarity,
          rarityColor:      d.rarityColor,
          itemType:         d.itemType,
          itemTypeColor:    d.itemTypeColor,
          description:      d.description,
          descriptionColor: d.descriptionColor,
          extraLines:       d.extraLines || [],
          imageSmall:       d.imageSmall,
          imageBig:         d.imageBig
        });
      } else {
        const payload = {
          name:             fldName.value.trim() || "Unnamed",
          nameColor:        pickrName.getColor().toHEXA().toString(),
          rarity:           fldRarity.value,
          rarityColor:      pickrRare.getColor().toHEXA().toString(),
          itemType:         fldItemType.value,
          itemTypeColor:    pickrItemType.getColor().toHEXA().toString(),
          description:      fldDescItem.value,
          descriptionColor: pickrDescItem.getColor().toHEXA().toString(),
          extraLines:       getLines(),
          imageSmall:       fldImgS.value,
          imageBig:         fldImgL.value
        };
        Object.assign(out, payload);
      }
    } else {
      Object.assign(out, {
        name: fldName.value,
        nameColor: pickrName.getColor().toHEXA().toString(),
        description: fldDescNI.value,
        descriptionColor: pickrDescNI.getColor().toHEXA().toString(),
        imageSmall: fldImgS.value,
        imageBig: fldImgL.value,
        videoURL: fldVid.value
      });
    }

    return out;
  }

  let submitCB = null;

  function openEdit(markerObj, data, evt, onSave) {
    populateForm(data);
    positionModal(modal, evt);
    openModal(modal);
    if (submitCB) form.removeEventListener("submit", submitCB);
    submitCB = e => {
      e.preventDefault();
      Object.assign(data, harvestForm(data.coords));
      onSave(data);
      closeModal(modal);
    };
    form.addEventListener("submit", submitCB);
  }

  function openCreate(coords, type, evt, onCreate) {
    populateForm({ type });
    positionModal(modal, evt);
    openModal(modal);
    if (submitCB) form.removeEventListener("submit", submitCB);
    submitCB = e => {
      e.preventDefault();
      const data = harvestForm(coords);
      onCreate(data);
      closeModal(modal);
    };
    form.addEventListener("submit", submitCB);
  }

  return {
    openEdit,
    openCreate,
    refreshPredefinedItems
  };
}

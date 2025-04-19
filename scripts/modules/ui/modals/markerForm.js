// @version: 17
// @file: /scripts/modules/ui/modals/markerForm.js

import { createModal, closeModal } from "../uiKit.js";
import { loadItemDefinitions } from "../../services/itemDefinitionsService.js";
import {
  createTextField,
  createFieldRow,
  createTextareaFieldWithColor,
  createImageField,
  createVideoField,
  createExtraInfoBlock,
  createFormButtonRow
} from "../uiKit.js";
import { createPickr } from "../pickrManager.js";

export function initMarkerForm(db) {
  // 1) Create the modal
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

  // — Type dropdown via createFieldRow —
  const fldType = document.createElement("select");
  fldType.id = "fld-type";
  fldType.classList.add("ui-input");
  fldType.innerHTML = `
    <option value="Door">Door</option>
    <option value="Extraction Portal">Extraction Portal</option>
    <option value="Item">Item</option>
    <option value="Teleport">Teleport</option>
    <option value="Spawn Point">Spawn points</option>
  `;
  const rowType = createFieldRow("Type:", fldType);

  // — Item dropdown via createFieldRow —
  const ddPre = document.createElement("select");
  ddPre.id = "fld-predef";
  ddPre.classList.add("ui-input");
  // options will be filled in refreshPredefinedItems()
  const rowPre = createFieldRow("Item:", ddPre);

  // — Item‑specific fields —
  const { row: rowRarity,     textarea: _r } = createTextareaFieldWithColor("", ""); // ignore
  const { row: rowRarityField, select: fldRarity } = (() => {
    const sel = document.createElement("select");
    sel.id = "fld-rarity"; sel.classList.add("ui-input");
    sel.innerHTML = `
      <option value="">Select Rarity</option>
      <option value="common">Common</option>
      <option value="uncommon">Uncommon</option>
      <option value="rare">Rare</option>
      <option value="epic">Epic</option>
      <option value="legendary">Legendary</option>
    `;
    return { row: createFieldRow("Rarity:", sel), select: sel };
  })();
  const { row: rowItemTypeField, select: fldItemType } = (() => {
    const sel = document.createElement("select");
    sel.id = "fld-item-type"; sel.classList.add("ui-input");
    sel.innerHTML = `
      <option value="Crafting Material">Crafting Material</option>
      <option value="Special">Special</option>
      <option value="Consumable">Consumable</option>
      <option value="Quest">Quest</option>
    `;
    return { row: createFieldRow("Item Type:", sel), select: sel };
  })();
  const { row: rowDescItem, textarea: fldDescItem } = createTextareaFieldWithColor("Description:", "fld-desc-item");

  // — Non‑item description —
  const { row: rowDescNI, textarea: fldDescNI } = createTextareaFieldWithColor("Description:", "fld-desc-nonitem");

  // — Image & video fields —
  const { row: rowImgS, input: fldImgS } = createImageField("Image S:", "fld-img-s");
  const { row: rowImgL, input: fldImgL } = createImageField("Image L:", "fld-img-l");
  const { row: rowVid, input: fldVid }   = createVideoField("Video:",    "fld-vid");

  // — Extra Info —
  const { block: extraInfoBlock, getLines, setLines } = createExtraInfoBlock();
  const rowExtra = document.createElement("div");
  rowExtra.className = "field-row extra-row";
  const lblExtra = document.createElement("label");
  lblExtra.textContent = "Extra Info:";
  rowExtra.append(lblExtra, extraInfoBlock);

  // Dividers around Extra Info
  const hrBeforeExtra = document.createElement("hr");
  const hrAfterExtra  = document.createElement("hr");

  // — Save/Cancel buttons —
  const rowButtons = createFormButtonRow(() => closeModal(modal));

  // Assemble item vs non‑item
  const blockItem = document.createElement("div");
  blockItem.append(
    rowRarityField,
    rowItemTypeField,
    rowDescItem,
    hrBeforeExtra,
    rowExtra,
    hrAfterExtra
  );
  const blockNI = document.createElement("div");
  blockNI.append(rowDescNI);

  // 6) Append all to the form
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

  // 7) Add to document
  document.body.appendChild(modal);

  // 8) Pickrs
  const pickrName     = createPickr("#fld-name-color");
  const pickrRare     = createPickr("#fld-rarity-color");
  const pickrItemType = createPickr("#fld-item-type-color");
  const pickrDescItem = createPickr("#fld-desc-item-color");
  const pickrDescNI   = createPickr("#fld-desc-nonitem-color");

  // State
  let defs = {};
  let customMode = false;

  // Toggle sections
  function toggleSections(isItem) {
    blockItem.style.display = isItem ? "block" : "none";
    blockNI.style.display   = isItem ? "none"  : "block";
    rowPre.style.display    = isItem ? "block" : "none";
  }
  fldType.onchange = () => toggleSections(fldType.value === "Item");

  // Load definitions
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

  // Populate form
  function populateForm(data = { type: "Item" }) {
    fldType.value = data.type;
    toggleSections(data.type === "Item");
    if (data.type === "Item") {
      if (data.predefinedItemId && defs[data.predefinedItemId]) {
        const def = defs[data.predefinedItemId];
        ddPre.value       = def.id;
        fldName.value     = def.name;
        pickrName.setColor(def.nameColor   || "#E5E6E8");
        fldRarity.value   = def.rarity;
        pickrRare.setColor(def.rarityColor || "#E5E6E8");
        fldItemType.value = def.itemType || def.type;
        pickrItemType.setColor(def.itemTypeColor || "#E5E6E8");
        fldDescItem.value = def.description;
        pickrDescItem.setColor(def.descriptionColor || "#E5E6E8");
        fldImgS.value     = def.imageSmall;
        fldImgL.value     = def.imageBig;
        fldVid.value      = "";
        setLines(def.extraLines || [], false);
        customMode = false;
      } else {
        ddPre.value       = "";
        fldName.value     = "";
        pickrName.setColor("#E5E6E8");
        fldRarity.value   = "";
        pickrRare.setColor("#E5E6E8");
        fldItemType.value = "";
        pickrItemType.setColor("#E5E6E8");
        fldDescItem.value = "";
        pickrDescItem.setColor("#E5E6E8");
        fldImgS.value     = "";
        fldImgL.value     = "";
        fldVid.value      = "";
        setLines([], false);
        customMode = true;
      }
    } else {
      fldName.value     = data.name       || "";
      pickrName.setColor(data.nameColor   || "#E5E6E8");
      fldImgS.value     = data.imageSmall || "";
      fldImgL.value     = data.imageBig   || "";
      fldVid.value      = data.videoURL   || "";
      fldDescNI.value   = data.description|| "";
      pickrDescNI.setColor(data.descriptionColor || "#E5E6E8");
    }
  }

  // Harvest form
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
        Object.assign(out, {
          name:             fldName.value.trim()   || "Unnamed",
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
        });
      }
    } else {
      Object.assign(out, {
        name:             fldName.value,
        nameColor:        pickrName.getColor().toHEXA().toString(),
        description:      fldDescNI.value,
        descriptionColor: pickrDescNI.getColor().toHEXA().toString(),
        imageSmall:       fldImgS.value,
        imageBig:         fldImgL.value,
        videoURL:         fldVid.value
      });
    }
    return out;
  }

  // Position helper
  function positionAtCursor(evt) {
    modal.style.display = "block";
    const rect = content.getBoundingClientRect();
    content.style.left = `${evt.clientX - rect.width}px`;
    content.style.top  = `${evt.clientY - rect.height/2}px`;
  }

  // Open handlers
  let submitCB;
  function openEdit(markerObj, data, evt, onSave) {
    populateForm(data);
    positionAtCursor(evt);
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
    positionAtCursor(evt);
    if (submitCB) form.removeEventListener("submit", submitCB);
    submitCB = e => {
      e.preventDefault();
      onCreate(harvestForm(coords));
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

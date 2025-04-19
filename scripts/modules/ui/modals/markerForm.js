// @version: 24
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
  const hrUnderHeader = document.createElement("hr");
  content.appendChild(hrUnderHeader);

  // 3) Form container
  const form = document.createElement("form");
  form.id = "edit-form";
  content.appendChild(form);

  // — Name field —
  const { row: rowName, input: fldName } = createTextField("Name:", "fld-name");
  fldName.classList.add("ui-input");

  // — Type dropdown via createDropdownField (hide its pickr) —
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

  // — Predefined‑Item dropdown with hidden pickr —
  const { row: rowPre, select: ddPre, colorBtn: pickrPreBtn } =
    createDropdownField("Item:", "fld-predef", []);
  ddPre.classList.add("ui-input");
  pickrPreBtn.style.visibility = "hidden";

  // — Item‑specific fields with pickr —
  const { row: rowRarity, select: fldRarity } =
    createDropdownField("Rarity:", "fld-rarity", [
      { value: "",         label: "Select Rarity" },
      { value: "common",   label: "Common"       },
      { value: "uncommon", label: "Uncommon"     },
      { value: "rare",     label: "Rare"         },
      { value: "epic",     label: "Epic"         },
      { value: "legendary",label: "Legendary"    }
    ]);
  rowRarity.classList.add("item-field");

  const { row: rowItemType, select: fldItemType } =
    createDropdownField("Item Type:", "fld-item-type", [
      { value: "Crafting Material", label: "Crafting Material" },
      { value: "Special",           label: "Special"           },
      { value: "Consumable",        label: "Consumable"        },
      { value: "Quest",             label: "Quest"             }
    ]);
  rowItemType.classList.add("item-field");

  const { row: rowDescItem, textarea: fldDescItem } =
    createTextareaFieldWithColor("Description:", "fld-desc-item");
  rowDescItem.classList.add("item-field");

  // — Non‑item description with pickr —
  const { row: rowDescNI, textarea: fldDescNI } =
    createTextareaFieldWithColor("Description:", "fld-desc-nonitem");

  // — Image & video fields (no pickr) —
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

  // Assemble item vs non‑item sections
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

  // 4) Append all to the form
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

  // 5) Add modal to the DOM
  document.body.appendChild(modal);

  // 6) Instantiate color pickers
  const pickrName     = createPickr("#fld-name-color");
  const pickrRare     = createPickr("#fld-rarity-color");
  const pickrItemType = createPickr("#fld-item-type-color");
  const pickrDescItem = createPickr("#fld-desc-item-color");
  const pickrDescNI   = createPickr("#fld-desc-nonitem-color");

  // Internal state
  let defs = {};
  let customMode = false;

  // Show/hide correct sections
  function toggleSections(isItem) {
    blockItem.style.display = isItem ? "block" : "none";
    blockNI.style.display   = isItem ? "none"  : "block";
    rowPre.style.display    = isItem ? "flex"  : "none";
  }
  fldType.onchange = () => toggleSections(fldType.value === "Item");

  // Load predefined items
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
      fldDescNI.value   = data.description|| "";
      pickrDescNI.setColor(data.descriptionColor || "#E5E6E8");
      fldImgS.value     = data.imageSmall || "";
      fldImgL.value     = data.imageBig   || "";
      fldVid.value      = data.videoURL   || "";
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

  // Position modal at cursor
  function positionAtCursor(evt) {
    modal.style.display = "block";
    const rect = content.getBoundingClientRect();
    content.style.left = `${evt.clientX - rect.width}px`;
    content.style.top  = `${evt.clientY - rect.height / 2}px`;
  }

  // Handlers
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

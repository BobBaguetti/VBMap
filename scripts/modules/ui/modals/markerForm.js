// @version: 31
// @file: /scripts/modules/ui/modals/markerForm.js

import { createModal, closeModal, openModalAt } from "../uiKit.js";
import { loadItemDefinitions } from "../../services/itemDefinitionsService.js";
import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createVideoField,
  createExtraInfoBlock,
  createFormButtonRow
} from "../uiKit.js";
import { createPickr } from "../pickrManager.js";
import { createTopAlignedFieldRow } from "../../utils/formUtils.js";


export function initMarkerForm(db) {
  // 1) Create modal (auto‐adds <hr> under header)
  const { modal, content } = createModal({
    id: "edit-marker-modal",
    title: "Edit Marker",
    size: "small",
    backdrop: false,
    draggable: true,
    withDivider: true,
    onClose: () => closeModal(modal)
  });

  // 2) Build the form container
  const form = document.createElement("form");
  form.id = "edit-form";
  content.appendChild(form);

  // — Name field —
  const { row: rowName, input: fldName } = createTextField("Name:", "fld-name");
  fldName.classList.add("ui-input");

  // — Type dropdown (no pickr) —
  const { row: rowType, select: fldType } =
    createDropdownField("Type:", "fld-type", [
      { value: "Door", label: "Door" },
      { value: "Extraction Portal", label: "Extraction Portal" },
      { value: "Item", label: "Item" },
      { value: "Teleport", label: "Teleport" },
      { value: "Spawn Point", label: "Spawn points" }
    ], { showColor: false });
  fldType.classList.add("ui-input");

  // — Predefined‐item dropdown (no pickr) —
  const { row: rowPre, select: ddPre } =
    createDropdownField("Item:", "fld-predef", [], { showColor: false });
  ddPre.classList.add("ui-input");

  // — Item‐specific fields with pickrs —
  const { row: rowRarity, select: fldRarity } =
    createDropdownField("Rarity:", "fld-rarity", [
      { value: "",          label: "Select Rarity" },
      { value: "common",    label: "Common"         },
      { value: "uncommon",  label: "Uncommon"       },
      { value: "rare",      label: "Rare"           },
      { value: "epic",      label: "Epic"           },
      { value: "legendary", label: "Legendary"      }
    ]);
  rowRarity.classList.add("item-gap");

  const { row: rowItemType, select: fldItemType } =
    createDropdownField("Item Type:", "fld-item-type", [
      { value: "Crafting Material", label: "Crafting Material" },
      { value: "Special",           label: "Special"           },
      { value: "Consumable",        label: "Consumable"        },
      { value: "Quest",             label: "Quest"             }
    ]);
  rowItemType.classList.add("item-gap");

  const { row: rowDescItem, textarea: fldDescItem } =
    createTextareaFieldWithColor("Description:", "fld-desc-item");
  rowDescItem.classList.add("item-gap");

  // — Non‐item description with pickr —
  const { row: rowDescNI, textarea: fldDescNI } =
    createTextareaFieldWithColor("Description:", "fld-desc-nonitem");

  // — Image & video fields —
  const { row: rowImgS, input: fldImgS } = createImageField("Image S:", "fld-img-s");
  const { row: rowImgL, input: fldImgL } = createImageField("Image L:", "fld-img-l");
  const { row: rowVid, input: fldVid }   = createVideoField("Video:",      "fld-vid");

  // — Extra Info block —
  const { block: extraInfoBlock, getLines, setLines } = createExtraInfoBlock();
  const rowExtra = createTopAlignedFieldRow("Extra Info:", extraInfoBlock);

  // Dividers around Extra Info
  const hrBeforeExtra = document.createElement("hr");
  const hrAfterExtra  = document.createElement("hr");

  // — Save/Cancel buttons —
  const rowButtons = createFormButtonRow(() => closeModal(modal));

  // 3) Assemble item vs non‐item sections
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

  // 4) Build the rest of the form
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

  // 6) Instantiate color pickrs
  const pickrName     = createPickr("#fld-name-color");
  const pickrRare     = createPickr("#fld-rarity-color");
  const pickrItemType = createPickr("#fld-item-type-color");
  const pickrDescItem = createPickr("#fld-desc-item-color");
  const pickrDescNI   = createPickr("#fld-desc-nonitem-color");

  // 7) Internal state & helpers
  let defs = {};
  let customMode = false;

  function toggleSections(isItem) {
    blockItem.style.display = isItem ? "block" : "none";
    blockNI.style.display   = isItem ? "none"  : "block";
    rowPre.style.display    = isItem ? "flex"  : "none";
  }
  fldType.onchange = () => toggleSections(fldType.value === "Item");

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
          imageBig:         d.imageBig,
          value:            d.value,      // ← now carried through
          quantity:         d.quantity    // ← now carried through
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
          imageBig:         fldImgL.value,
          value:            "",  // custom markers start blank
          quantity:         ""   // custom markers start blank
        });
      }
    } else {
      Object.assign(out, {
        name:            fldName.value,
        nameColor:       pickrName.getColor().toHEXA().toString(),
        description:     fldDescNI.value,
        descriptionColor:pickrDescNI.getColor().toHEXA().toString(),
        imageSmall:      fldImgS.value,
        imageBig:        fldImgL.value,
        videoURL:        fldVid.value
      });
    }
    return out;
  }

  let submitCB;
  function openEdit(markerObj, data, evt, onSave) {
    populateForm(data);
    openModalAt(modal, evt);
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
    openModalAt(modal, evt);
    if (submitCB) form.removeEventListener("submit", submitCB);
    submitCB = e => {
      e.preventDefault();
      onCreate(harvestForm(coords));
      closeModal(modal);
    };
    form.addEventListener("submit", submitCB);
  }

  const pickrRefs = { pickrName, pickrRare, pickrItemType, pickrDescItem, pickrDescNI };

  return {
    openEdit,
    openCreate,
    refreshPredefinedItems
  };
}

// @version: 8
// @file:    /scripts/modules/ui/modals/markerForm.js

import { positionModal } from "../uiManager.js";
import {
  loadItemDefinitions,
  addItemDefinition
} from "../../services/itemDefinitionsService.js";

import {
  createModal,
  createFieldRow,
  createColorFieldRow,
  createExtraInfoBlock,
  createTextField,
  createDropdownField,
  createImageField,
  createVideoField,
  openModal,
  closeModal
} from "../ui/uiKit.js";

import { createPickr } from "../ui/pickrManager.js";

export function initMarkerForm(db) {
  const { modal, content } = createModal({
    id: "edit-marker-modal",
    title: "Edit Marker",
    onClose: () => closeModal(modal)
  });

  const form = document.createElement("form");
  form.id = "edit-form";
  content.appendChild(form);

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

  // Rows
  const { row: rowName,      colorBtn: pickrName   } = createColorFieldRow("Name:", fldName, "pickr-name");
  const rowType    = createFieldRow("Type:", fldType);
  const rowPre     = createFieldRow("Item:", ddPre);
  const { row: rowRarity,    colorBtn: pickrRare   } = createColorFieldRow("Rarity:", fldRare, "pickr-rarity");
  const { row: rowItemType,  colorBtn: pickrIType  } = createColorFieldRow("Item Type:", fldIType, "pickr-itemtype");
  const { row: rowDescItem,  colorBtn: pickrDescIt } = createColorFieldRow("Description:", fldDescIt, "pickr-desc-item");
  const { row: rowDescNI,    colorBtn: pickrDescNI } = createColorFieldRow("Description:", fldDescNI, "pickr-desc-nonitem");
  const rowImgS    = createFieldRow("Image S:", fldImgS);
  const rowImgL    = createFieldRow("Image L:", fldImgL);
  const rowVideo   = createFieldRow("Video:", fldVid);

  const btnAddLine = document.createElement("button");
  btnAddLine.type = "button";
  btnAddLine.textContent = "+";
  btnAddLine.classList.add("ui-button");
  const rowExtra   = createFieldRow("Extra Info:", btnAddLine);
  const wrapLines  = document.createElement("div");

  const rowButtons = document.createElement("div");
  rowButtons.classList.add("field-row");
  rowButtons.style.justifyContent = "center";
  rowButtons.style.marginTop = "10px";

  const btnSave = document.createElement("button");
  btnSave.type = "submit";
  btnSave.textContent = "Save";
  btnSave.classList.add("ui-button");

  const btnCancel = document.createElement("button");
  btnCancel.type = "button";
  btnCancel.textContent = "Cancel";
  btnCancel.classList.add("ui-button");

  rowButtons.append(btnSave, btnCancel);

  const blockItem = document.createElement("div");
  blockItem.append(
    rowRarity,
    rowItemType,
    rowDescItem,
    document.createElement("hr"),
    rowExtra,
    wrapLines,
    document.createElement("hr")
  );
  const blockNI = document.createElement("div");
  blockNI.append(rowDescNI, document.createElement("hr"));

  form.append(
    rowName,
    rowType,
    rowPre,
    blockItem,
    blockNI,
    rowImgS,
    rowImgL,
    rowVideo,
    rowButtons
  );

  document.body.appendChild(modal);

  // ----- State and Pickr Setup -----
  let defs = {}, customMode = false;
  let lines = [];

  function renderLines(readOnly = false) {
    wrapLines.innerHTML = "";
    lines.forEach((ln, i) => {
      const row = document.createElement("div");
      row.classList.add("field-row");

      const txt = document.createElement("input");
      txt.className = "ui-input";
      txt.value = ln.text;
      txt.readOnly = readOnly;
      txt.oninput = () => {
        lines[i].text = txt.value;
        customMode = true;
      };

      const clr = document.createElement("div");
      clr.className = "color-btn";
      clr.id = `extra-color-${i}`;

      const rm = document.createElement("button");
      rm.type = "button";
      rm.textContent = "×";
      rm.className = "ui-button";
      rm.onclick = () => {
        lines.splice(i, 1);
        renderLines(false);
        customMode = true;
      };

      row.append(txt, clr);
      if (!readOnly) row.append(rm);
      wrapLines.appendChild(row);

      const picker = createPickr(`#${clr.id}`);
      picker.setColor(ln.color || "#E5E6E8");
    });
  }

  btnAddLine.onclick = () => {
    lines.push({ text: "", color: "#E5E6E8" });
    renderLines(false);
    customMode = true;
  };

  function toggleSections(isItem) {
    blockItem.style.display = isItem ? "block" : "none";
    blockNI.style.display   = isItem ? "none" : "block";
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
        fldRare.value = def.rarity;
        pickrRare.setColor(def.rarityColor || "#E5E6E8");
        fldIType.value = def.itemType || def.type;
        pickrIType.setColor(def.itemTypeColor || "#E5E6E8");
        fldDescIt.value = def.description;
        pickrDescIt.setColor(def.descriptionColor || "#E5E6E8");
        fldImgS.value = def.imageSmall;
        fldImgL.value = def.imageBig;
        fldVid.value = "";
        lines = def.extraLines || [];
        renderLines(true);
        customMode = false;
      } else {
        customMode = true;
        ddPre.value = "";
        fldName.value = "";
        pickrName.setColor("#E5E6E8");
        fldRare.value = "";
        pickrRare.setColor("#E5E6E8");
        fldIType.value = "";
        pickrIType.setColor("#E5E6E8");
        fldDescIt.value = "";
        pickrDescIt.setColor("#E5E6E8");
        fldImgS.value = "";
        fldImgL.value = "";
        fldVid.value = "";
        lines = [];
        renderLines(false);
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
          rarity:           fldRare.value,
          rarityColor:      pickrRare.getColor().toHEXA().toString(),
          itemType:         fldIType.value,
          itemTypeColor:    pickrIType.getColor().toHEXA().toString(),
          description:      fldDescIt.value,
          descriptionColor: pickrDescIt.getColor().toHEXA().toString(),
          extraLines:       lines,
          imageSmall:       fldImgS.value,
          imageBig:         fldImgL.value
        };
        Object.assign(out, payload);
      }
    } else {
      out.name = fldName.value;
      out.nameColor = pickrName.getColor().toHEXA().toString();
      out.description = fldDescNI.value;
      out.descriptionColor = pickrDescNI.getColor().toHEXA().toString();
      out.imageSmall = fldImgS.value;
      out.imageBig = fldImgL.value;
      out.videoURL = fldVid.value;
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

  btnCancel.onclick = () => closeModal(modal);

  return {
    openEdit,
    openCreate,
    refreshPredefinedItems
  };
}

// @version: 8
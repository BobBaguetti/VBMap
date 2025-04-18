// @fullfile: Send the entire file, no omissions or abridgments.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted.
// @version: 3
// @file:    /scripts/modules/markerForm.js

import { makeDraggable, positionModal } from "./uiManager.js";
import { Modal } from "./uiKit/modalManager.js";
import { pickerManager } from "./uiKit/pickerManager.js";
import {
  loadItemDefinitions,
  addItemDefinition
} from "./itemDefinitionsService.js";

export function initMarkerForm(db) {
  /* ---------- DOM elements --------- */
  const modalEl   = document.getElementById("edit-modal");
  const grip      = document.getElementById("edit-modal-handle");
  const form      = document.getElementById("edit-form");
  const btnCancel = document.getElementById("edit-cancel");

  makeDraggable(modalEl, grip);
  const editModal = new Modal(modalEl);

  /* ---------- Color pickers ---------- */
  const pkName  = pickerManager.create("#pickr-name");
  const pkRare  = pickerManager.create("#pickr-rarity");
  const pkItyp  = pickerManager.create("#pickr-itemtype");
  const pkDitm  = pickerManager.create("#pickr-desc-item");
  const pkDni   = pickerManager.create("#pickr-desc-nonitem");

  /* ---------- Item definitions ---------- */
  let defs = {}, customMode = false;
  async function refreshItems() {
    const list = await loadItemDefinitions(db);
    defs = Object.fromEntries(list.map(d => [d.id, d]));
    const ddPre = document.getElementById("predefined-item-dropdown");
    ddPre.innerHTML = `<option value="">None (custom)</option>`;
    list.forEach(d => {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.name;
      ddPre.appendChild(o);
    });
  }
  refreshItems();

  /* ---------- Extra‑info lines ---------- */
  let lines = [];
  function renderLines(readOnly = false) {
    const wrapLines = document.getElementById("extra-lines");
    wrapLines.innerHTML = "";
    lines.forEach((ln, i) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.style.marginBottom = "5px";

      const txt = document.createElement("input");
      txt.value = ln.text;
      txt.readOnly = readOnly;
      txt.style.cssText =
        "width:100%;background:#E5E6E8;color:#000;padding:4px 6px;border:1px solid #999;";
      if (readOnly) {
        txt.style.background = "#3b3b3b";
        txt.style.cursor = "not-allowed";
      }
      txt.oninput = () => {
        lines[i].text = txt.value;
        customMode = true;
      };

      const clr = document.createElement("div");
      clr.className = "color-btn";
      clr.style.marginLeft = "5px";

      row.append(txt, clr);
      if (!readOnly) {
        const rm = document.createElement("button");
        rm.textContent = "×";
        rm.type = "button";
        rm.style.marginLeft = "5px";
        rm.onclick = () => {
          lines.splice(i, 1);
          renderLines(false);
          customMode = true;
        };
        row.append(rm);
      }

      wrapLines.appendChild(row);

      // attach a picker to this new color-btn
      const p = pickerManager.create(clr);
      if (p) {
        p.setColor(ln.color || "#E5E6E8")
         .on("change", color => { lines[i].color = color.toHEXA().toString(); });
      }
    });
  }

  document.getElementById("add-extra-line").onclick = () => {
    lines.push({ text: "", color: "#E5E6E8" });
    renderLines(false);
    customMode = true;
  };

  /* ---------- UI helpers ---------- */
  const fldName   = document.getElementById("edit-name");
  const fldType   = document.getElementById("edit-type");
  const fldImgS   = document.getElementById("edit-image-small");
  const fldImgL   = document.getElementById("edit-image-big");
  const fldVid    = document.getElementById("edit-video-url");
  const fldRare   = document.getElementById("edit-rarity");
  const fldIType  = document.getElementById("edit-item-type");
  const fldDescIt = document.getElementById("edit-description");
  const fldDescNI = document.getElementById("edit-description-non-item");
  const blockItem = document.getElementById("item-extra-fields");
  const blockNI   = document.getElementById("non-item-description");
  const blockPre  = document.getElementById("predefined-item-container");
  const ddPre     = document.getElementById("predefined-item-dropdown");

  function setRO(el, on) {
    el.disabled = on;
    el.readOnly = on;
    el.style.background = on ? "#3b3b3b" : "#E5E6E8";
    el.style.cursor = on ? "not-allowed" : "text";
    if (el.tagName === "SELECT") el.style.pointerEvents = on ? "none" : "auto";
  }
  function lockItemFields(on) {
    [
      fldName, fldRare, fldIType,
      fldDescIt, fldImgS, fldImgL, fldVid
    ].forEach(e => setRO(e, on));
  }
  function toggleSections(isItem) {
    blockItem.style.display = isItem ? "block" : "none";
    blockNI.style.display   = isItem ? "none"  : "block";
    blockPre.style.display  = isItem ? "block" : "none";
  }
  function applyUI() {
    const isItem = fldType.value === "Item";
    toggleSections(isItem);
    lockItemFields(isItem && !customMode);
    if (!isItem) {
      ddPre.value = "";
      customMode = false;
    }
  }
  fldType.onchange = applyUI;
  ddPre.onchange = () => {
    if (ddPre.value) {
      customMode = false;
      fillFormFromDef(defs[ddPre.value]);
      lockItemFields(true);
    } else {
      customMode = true;
      clearFormForCustom();
      lockItemFields(false);
    }
  };

  function clearFormForCustom() {
    fldName.value = fldRare.value = fldIType.value = fldDescIt.value = "";
    [pkName, pkRare, pkItyp, pkDitm].forEach(p => p && p.setColor("#E5E6E8"));
    fldImgS.value = fldImgL.value = fldVid.value = "";
    lines = [];
    renderLines(false);
  }

  function fillFormFromDef(d) {
    fldName.value = d.name;
    pkName.setColor(d.nameColor);
    fldRare.value = d.rarity;
    pkRare.setColor(d.rarityColor);
    fldIType.value = d.itemType;
    pkItyp.setColor(d.itemTypeColor);
    fldDescIt.value = d.description;
    pkDitm.setColor(d.descriptionColor);
    fldImgS.value = d.imageSmall;
    fldImgL.value = d.imageBig;
    lines = JSON.parse(JSON.stringify(d.extraLines || []));
    renderLines(true);
  }

  function populateForm(m = { type: "Item" }) {
    fldType.value = m.type;
    customMode = !m.predefinedItemId;
    applyUI();
    if (m.type === "Item") {
      if (m.predefinedItemId) {
        ddPre.value = m.predefinedItemId;
        fillFormFromDef(defs[m.predefinedItemId]);
      } else {
        ddPre.value = "";
        clearFormForCustom();
      }
    } else {
      fldName.value = m.name;
      pkName.setColor(m.nameColor);
      fldImgS.value = m.imageSmall;
      fldImgL.value = m.imageBig;
      fldVid.value  = m.videoURL;
      fldDescNI.value = m.description;
      pkDni.setColor(m.descriptionColor);
    }
  }

  function harvestForm(coords) {
    const out = { type: fldType.value, coords };
    if (out.type === "Item") {
      if (!customMode) {
        const d = defs[ddPre.value];
        return { ...out, predefinedItemId: d.id, ...d };
      } else {
        const data = {
          name: fldName.value.trim() || "Unnamed",
          nameColor: pkName.getColor().toHEXA().toString(),
          rarity: fldRare.value,
          rarityColor: pkRare.getColor().toHEXA().toString(),
          itemType: fldIType.value,
          itemTypeColor: pkItyp.getColor().toHEXA().toString(),
          description: fldDescIt.value,
          descriptionColor: pkDitm.getColor().toHEXA().toString(),
          extraLines: [...lines],
          imageSmall: fldImgS.value,
          imageBig: fldImgL.value
        };
        addItemDefinition(db, data).then(newDef => {
          defs[newDef.id] = newDef;
          ddPre.value = newDef.id;
          customMode = false;
          fillFormFromDef(newDef);
          lockItemFields(true);
        });
        return { ...out, ...data };
      }
    } else {
      return {
        ...out,
        name: fldName.value || "New Marker",
        nameColor: pkName.getColor().toHEXA().toString(),
        imageSmall: fldImgS.value,
        imageBig: fldImgL.value,
        videoURL: fldVid.value,
        description: fldDescNI.value,
        descriptionColor: pkDni.getColor().toHEXA().toString()
      };
    }
  }

  /* ---------- Modal openers ---------- */
  let submitCB;
  function openEdit(markerObj, data, evt, onSave) {
    populateForm(data);
    positionModal(modalEl, evt);
    editModal.open();
    if (submitCB) form.removeEventListener("submit", submitCB);
    submitCB = e => {
      e.preventDefault();
      Object.assign(data, harvestForm(data.coords));
      onSave(data);
      editModal.close();
    };
    form.addEventListener("submit", submitCB);
  }

  function openCreate(coords, defaultType, evt, onCreate) {
    populateForm({ type: defaultType || "Item" });
    positionModal(modalEl, evt);
    editModal.open();
    if (submitCB) form.removeEventListener("submit", submitCB);
    submitCB = e => {
      e.preventDefault();
      onCreate(harvestForm(coords));
      editModal.close();
    };
    form.addEventListener("submit", submitCB);
  }

  btnCancel.onclick = () => editModal.close();

  return {
    openEdit,
    openCreate,
    refreshPredefinedItems: refreshItems
  };
}

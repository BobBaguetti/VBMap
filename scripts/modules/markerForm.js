// @fullfile: Send the entire file, no omissions or abridgments.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 1   The current file version is 1. Increase by 1 every time you update anything.
// @file:    /scripts/modules/markerForm.js

import { makeDraggable, positionModal } from "./uiManager.js";
import {
  loadItemDefinitions,
  addItemDefinition
} from "./itemDefinitionsService.js";

export function initMarkerForm(db) {
  /* ---------- DOM elements --------- */
  const modal     = document.getElementById("edit-modal");
  const grip      = document.getElementById("edit-modal-handle");
  const form      = document.getElementById("edit-form");
  const btnCancel = document.getElementById("edit-cancel");

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
  blockPre.querySelector("label").textContent = "Item:";
  const ddPre     = document.getElementById("predefined-item-dropdown");

  const btnAddLine = document.getElementById("add-extra-line");
  const wrapLines  = document.getElementById("extra-lines");

  makeDraggable(modal, grip);

  /* ---------- Color pickers ---------- */
  const pickrs = [];
  function mkPicker(sel) {
    const container = document.querySelector(sel);
    if (!container) {
      console.warn(`markerForm.mkPicker: element ${sel} not found`);
      // return a stub that won't break calls to .on or .setColor or .getRoot
      return {
        on:    () => {},
        setColor: () => {},
        getRoot: () => null
      };
    }
    const p = Pickr.create({
      el: container,
      theme: "nano",
      default: "#E5E6E8",
      components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: { hex: true, rgba: true, input: true, save: true }
      }
    }).on("save", (_, instance) => instance.hide());
    pickrs.push(p);
    return p;
  }

  const pkName = mkPicker("#pickr-name");
  const pkRare = mkPicker("#pickr-rarity");
  const pkItyp = mkPicker("#pickr-itemtype");
  const pkDitm = mkPicker("#pickr-desc-item");
  const pkDni  = mkPicker("#pickr-desc-nonitem");

  /* ---------- Item definitions ---------- */
  let defs = {}, customMode = false;
  async function refreshItems() {
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
  refreshItems();

  /* ---------- Extra‑info lines ---------- */
  let lines = [];
  function renderLines(readOnly = false) {
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
      clr.style.pointerEvents = readOnly ? "none" : "auto";
      clr.style.opacity = readOnly ? 0.5 : 1;

      const rm = document.createElement("button");
      rm.textContent = "×";
      rm.type = "button";
      rm.style.marginLeft = "5px";
      if (readOnly) {
        rm.style.display = "none";
      } else {
        rm.onclick = () => {
          lines.splice(i, 1);
          renderLines(false);
          customMode = true;
        };
      }

      row.append(txt, clr);
      if (!readOnly) row.append(rm);
      wrapLines.appendChild(row);

      // Only create a Pickr if container exists
      mkPicker(`#${clr.id || ''}`)?.setColor(ln.color || "#E5E6E8");
    });
  }
  btnAddLine.onclick = () => {
    lines.push({ text: "", color: "#E5E6E8" });
    renderLines(false);
    customMode = true;
  };

  /* ---------- UI helpers ---------- */
  const DIS_BG = "#3b3b3b";
  const ALL_FIELDS = [
    fldName,
    fldRare,
    fldIType,
    fldDescIt,
    fldImgS,
    fldImgL,
    fldVid
  ];
  function setRO(el, on) {
    el.disabled = on;
    el.readOnly = on;
    el.style.background = on ? DIS_BG : "#E5E6E8";
    el.style.cursor = on ? "not-allowed" : "text";
    if (el.tagName === "SELECT") el.style.pointerEvents = on ? "none" : "auto";
  }
  function lockItemFields(on) {
    ALL_FIELDS.forEach(e => setRO(e, on));
    pickrs.forEach(p => {
      const root = p.getRoot?.();
      if (root && root.style) {
        root.style.pointerEvents = on ? "none" : "auto";
        root.style.opacity = on ? 0.5 : 1;
      }
    });
    btnAddLine.style.display = on ? "none" : "inline-block";
  }
  function toggleSections(isItem) {
    blockItem.style.display = isItem ? "block" : "none";
    blockNI.style.display = isItem ? "none" : "block";
    blockPre.style.display = isItem ? "block" : "none";
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

  /* ---------- Predefined dropdown ---------- */
  ddPre.style.width = "100%";
  ddPre.onchange = () => {
    const id = ddPre.value;
    if (id) {
      customMode = false;
      fillFormFromDef(defs[id]);
      lockItemFields(true);
    } else {
      customMode = true;
      clearFormForCustom();
      lockItemFields(false);
    }
  };

  function clearFormForCustom() {
    fldName.value = fldRare.value = fldIType.value = fldDescIt.value = "";
    [pkName, pkRare, pkItyp, pkDitm].forEach(p => p.setColor("#E5E6E8"));
    fldImgS.value = fldImgL.value = fldVid.value = "";
    lines = [];
    renderLines(false);
  }

  function fillFormFromDef(d) {
    fldName.value = d.name;
    pkName.setColor(d.nameColor || "#E5E6E8");

    fldRare.value = d.rarity || "";
    pkRare.setColor(d.rarityColor || "#E5E6E8");

    fldIType.value = d.itemType || d.type;
    pkItyp.setColor(d.itemTypeColor || "#E5E6E8");

    fldDescIt.value = d.description || "";
    pkDitm.setColor(d.descriptionColor || "#E5E6E8");

    fldImgS.value = d.imageSmall || "";
    fldImgL.value = d.imageBig   || "";
    fldVid.value  = "";

    lines = JSON.parse(JSON.stringify(d.extraLines || []));
    renderLines(true);
  }

  /* ---------- Populate / Harvest ---------- */
  function populateForm(m = { type: "Item" }) {
    fldType.value = m.type;
    customMode = !m.predefinedItemId;
    applyUI();

    if (m.type === "Item") {
      if (m.predefinedItemId && defs[m.predefinedItemId]) {
        ddPre.value = m.predefinedItemId;
        fillFormFromDef(defs[m.predefinedItemId]);
      } else {
        ddPre.value = "";
        clearFormForCustom();
      }
    } else {
      fldName.value = m.name || "";
      pkName.setColor(m.nameColor || "#E5E6E8");

      fldImgS.value = m.imageSmall || "";
      fldImgL.value = m.imageBig   || "";
      fldVid.value  = m.videoURL   || "";

      fldDescNI.value = m.description || "";
      pkDni.setColor(m.descriptionColor || "#E5E6E8");
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
          itemType:         d.itemType || d.type,
          itemTypeColor:    d.itemTypeColor,
          description:      d.description,
          descriptionColor: d.descriptionColor,
          extraLines:       JSON.parse(JSON.stringify(d.extraLines)),
          imageSmall:       d.imageSmall,
          imageBig:         d.imageBig
        });
      } else {
        const defPayload = {
          name:             fldName.value.trim() || "Unnamed",
          nameColor:        pkName.getColor()?.toHEXA()?.toString() || "#E5E6E8",
          rarity:           fldRare.value,
          rarityColor:      pkRare.getColor()?.toHEXA()?.toString() || "#E5E6E8",
          itemType:         fldIType.value,
          itemTypeColor:    pkItyp.getColor()?.toHEXA()?.toString() || "#E5E6E8",
          description:      fldDescIt.value,
          descriptionColor: pkDitm.getColor()?.toHEXA()?.toString() || "#E5E6E8",
          extraLines:       JSON.parse(JSON.stringify(lines)),
          imageSmall:       fldImgS.value,
          imageBig:         fldImgL.value
        };
        addItemDefinition(db, defPayload).then(newDef => {
          defs[newDef.id] = newDef;
          ddPre.value     = newDef.id;
          customMode      = false;
          fillFormFromDef(newDef);
          lockItemFields(true);
        });
        Object.assign(out, defPayload);
      }
    } else {
      out.name             = fldName.value || "New Marker";
      out.nameColor        = pkName.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      out.imageSmall       = fldImgS.value;
      out.imageBig         = fldImgL.value;
      out.videoURL         = fldVid.value || "";
      out.description      = fldDescNI.value;
      out.descriptionColor = pkDni.getColor()?.toHEXA()?.toString() || "#E5E6E8";
    }

    Object.keys(out).forEach(k => out[k] === undefined && delete out[k]);
    return out;
  }

  /* ---------- Modal openers ---------- */
  let submitCB = null;
  function openEdit(markerObj, data, evt, onSave) {
    populateForm(data);
    positionModal(modal, evt);
    modal.style.display = "block";
    if (submitCB) form.removeEventListener("submit", submitCB);
    submitCB = e => {
      e.preventDefault();
      Object.assign(data, harvestForm(data.coords));
      onSave(data);
      modal.style.display = "none";
    };
    form.addEventListener("submit", submitCB);
  }

  function openCreate(coords, defaultType, evt, onCreate) {
    populateForm({ type: defaultType || "Item" });
    positionModal(modal, evt);
    modal.style.display = "block";
    if (submitCB) form.removeEventListener("submit", submitCB);
    submitCB = e => {
      e.preventDefault();
      onCreate(harvestForm(coords));
      modal.style.display = "none";
    };
    form.addEventListener("submit", submitCB);
  }

  btnCancel.onclick = () => (modal.style.display = "none");

  return {
    openEdit,
    openCreate,
    refreshPredefinedItems: refreshItems
  };
}

// @version: 1
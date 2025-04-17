// scripts/modules/markerForm.js
import { makeDraggable, positionModal } from "./uiManager.js";
import {
  loadItemDefinitions,
  addItemDefinition
} from "./itemDefinitionsService.js";

export function initMarkerForm(db) {
  /* ---------- DOM elements --------- */
  const modal      = document.getElementById("edit-modal");
  const grip       = document.getElementById("edit-modal-handle");
  const form       = document.getElementById("edit-form");
  const btnCancel  = document.getElementById("edit-cancel");

  const fldName    = document.getElementById("edit-name");
  const fldType    = document.getElementById("edit-type");
  const fldImgS    = document.getElementById("edit-image-small");
  const fldImgL    = document.getElementById("edit-image-big");
  const fldVid     = document.getElementById("edit-video-url");
  const fldRare    = document.getElementById("edit-rarity");
  const fldIType   = document.getElementById("edit-item-type");
  const fldDescIt  = document.getElementById("edit-description");
  const fldDescNI  = document.getElementById("edit-description-non-item");

  const blockItem  = document.getElementById("item-extra-fields");
  const blockNI    = document.getElementById("non-item-description");
  const blockPre   = document.getElementById("predefined-item-container");
  blockPre.querySelector("label").textContent = "Item:";
  const ddPre      = document.getElementById("predefined-item-dropdown");

  const btnAddLine = document.getElementById("add-extra-line");
  const wrapLines  = document.getElementById("extra-lines");

  makeDraggable(modal, grip);

  /* ---------- Pickr color pickers ---------- */
  const pickrs = [];
  function mkPicker(sel) {
    const p = Pickr.create({
      el: sel, theme: "nano", default: "#E5E6E8",
      components: {
        preview: true, opacity: true, hue: true,
        interaction: { hex: true, rgba: true, input: true, save: true }
      }
    }).on("save", (_, pickr) => pickr.hide());
    pickrs.push(p);
    return p;
  }
  const pkName = mkPicker("#pickr-name");
  const pkRare = mkPicker("#pickr-rarity");
  const pkItyp = mkPicker("#pickr-itemtype");
  const pkDitm = mkPicker("#pickr-desc-item");
  const pkDni  = mkPicker("#pickr-desc-nonitem");

  /* ---------- Item definitions data ---------- */
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

  /* ---------- Extra-info lines ---------- */
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
      txt.style.cssText = "width:100%;background:#E5E6E8;color:#000;" +
        "padding:4px 6px;border:1px solid #999;";
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

      Pickr.create({
        el: clr,
        theme: "nano",
        default: ln.color || "#E5E6E8",
        components: {
          preview: true,
          opacity: true,
          hue: true,
          interaction: { hex: true, rgba: true, input: true, save: true }
        }
      })
        .on("change", c => {
          lines[i].color = c.toHEXA().toString();
          customMode = true;
        })
        .on("save", (_, p) => p.hide())
        .setColor(ln.color || "#E5E6E8");
    });
  }
  btnAddLine.onclick = () => {
    lines.push({ text: "", color: "#E5E6E8" });
    renderLines(false);
    customMode = true;
  };

  /* ---------- UI helpers ---------- */
  const DISABLED_BG = "#3b3b3b";
  const ALL_FIELDS = [fldName, fldRare, fldIType, fldDitm, fldImgS, fldImgL, fldVid];
  function setReadOnly(el, on) {
    el.disabled = on;
    el.readOnly = on;
    el.style.background = on ? DISABLED_BG : "#E5E6E8";
    el.style.cursor = on ? "not-allowed" : "text";
    if (el.tagName === "SELECT") {
      el.style.pointerEvents = on ? "none" : "auto";
    }
  }
  function lockItemFields(on) {
    ALL_FIELDS.forEach(f => setReadOnly(f, on));
    pickrs.forEach(p => {
      const r = p?.getRoot?.();
      if (r && r.style) {
        r.style.pointerEvents = on ? "none" : "auto";
        r.style.opacity = on ? 0.5 : 1;
      }
    });
    btnAddLine.style.display = on ? "none" : "inline-block";
  }
  function toggleSections(isItem) {
    blockItem.style.display = isItem ? "block" : "none";
    blockNI.style.display   = isItem ? "none" : "block";
    blockPre.style.display  = isItem ? "block" : "none";
  }
  function applyUI() {
    const isItem = fldType.value === "Item";
    // hide/show item‑only rows
    toggleSections(isItem);
    // disable fields for predefined Item
    lockItemFields(isItem && !customMode);
    // if not Item at all, clear dropdown & reset customMode
    if (!isItem) {
      ddPre.value = "";
      customMode = false;
    }
  }
  fldType.onchange = applyUI;

  /* ---------- Dropdown behavior ---------- */
  ddPre.style.width = "100%";
  ddPre.onchange = () => {
    const id = ddPre.value;
    if (id) {
      // choosing a predefined item
      customMode = false;
      fillFormFromDef(defs[id]);
      lockItemFields(true);
    } else {
      // "None (custom)" selected
      customMode = true;
      clearFormForCustom();
      lockItemFields(false);
    }
  };

  function clearFormForCustom() {
    fldName.value = fldRare.value = fldIType.value = fldDescIt.value = "";
    [pkName, pkRare, pkItyp, pkDitm].forEach(pk => pk.setColor("#E5E6E8"));
    fldImgS.value = fldImgL.value = fldVid.value = "";
    lines = [];
    renderLines(false);
  }
  function fillFormFromDef(d) {
    fldName.value   = d.name;
    pkName.setColor(d.nameColor || "#E5E6E8");

    fldRare.value   = d.rarity || "";
    pkRare.setColor(d.rarityColor || "#E5E6E8");

    fldIType.value  = d.itemType || d.type; // <<<<<< FIXED: use d.type if d.itemType undefined
    pkItyp.setColor(d.itemTypeColor || "#E5E6E8");

    fldDescIt.value = d.description || "";
    pkDitm.setColor(d.descriptionColor || "#E5E6E8");

    fldImgS.value   = d.imageSmall || "";
    fldImgL.value   = d.imageBig   || "";
    fldVid.value    = "";

    lines = d.extraLines ? JSON.parse(JSON.stringify(d.extraLines)) : [];
    renderLines(true);
  }

  /* ---------- Populate/Harvest ---------- */
  function populateForm(m = { type: "Item" }) {
    fldType.value = m.type;
    // if existing marker has a predefined ID, use it
    customMode = !(m.predefinedItemId);
    applyUI();

    if (m.type === "Item") {
      if (m.predefinedItemId && defs[m.predefinedItemId]) {
        ddPre.value = m.predefinedItemId;
        fillFormFromDef(defs[m.predefinedItemId]);
      } else {
        // new custom
        ddPre.value = "";
        clearFormForCustom();
      }
    } else {
      // non‑item marker
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
        // predefined: pull from defs map
        const d = defs[ddPre.value];
        if (d) {
          out.predefinedItemId = d.id;
          Object.assign(out, {
            name:             d.name,
            nameColor:        d.nameColor,
            rarity:           d.rarity,
            rarityColor:      d.rarityColor,
            itemType:         (d.itemType || d.type), // now using d.type fallback
            itemTypeColor:    d.itemTypeColor,
            description:      d.description,
            descriptionColor: d.descriptionColor,
            extraLines:       JSON.parse(JSON.stringify(d.extraLines || [])),
            imageSmall:       d.imageSmall,
            imageBig:         d.imageBig
          });
        }
      } else {
        // custom: gather form fields and add to library
        const def = {
          name:             fldName.value      .trim() || "Unnamed",
          nameColor:        pkName.getColor()?.toHEXA()?.toString() || "#E5E6E8",
          rarity:           fldRare.value,
          rarityColor:      pkRare.getColor()?.toHEXA()?.toString() || "#E5E6E8",
          itemType:         fldIType.value,
          itemTypeColor:    pkItyp.getColor()?.toHEXA()?.toString() || "#E5E6E8",
          description:      fldDescIt.value   ,
          descriptionColor: pkDitm.getColor()?.toHEXA()?.toString() || "#E5E6E8",
          extraLines:       JSON.parse(JSON.stringify(lines)),
          imageSmall:       fldImgS.value     ,
          imageBig:         fldImgL.value
        };
        // save new item definition
        addItemDefinition(db, def).then(newDef => {
          defs[newDef.id] = newDef;
          ddPre.value     = newDef.id;
          customMode      = false;
          fillFormFromDef(newDef);
          lockItemFields(true);
        });
        // use the raw fields until the promise resolves
        Object.assign(out, def);
      }
    } else {
      // non‑Item marker
      out.name             = fldName.value     || "New Marker";
      out.nameColor        = pkName.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      out.imageSmall       = fldImgS.value;
      out.imageBig         = fldImgL.value;
      out.videoURL         = fldVid.value      || "";
      out.description      = fldDescNI.value;
      out.descriptionColor = pkDni.getColor()?.toHEXA()?.toString() || "#E5E6E8";
    }

    // strip undefined to avoid Firestore errors
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

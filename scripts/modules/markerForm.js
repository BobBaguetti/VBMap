// scripts/modules/markerForm.js
// Edit / Create Marker modal.
//
// • Markers linked to a predefined Item are read‑only; all their
//   item‑specific data is inherited from the Items library.
// • Free‑form markers (Door, Extraction Portal, Teleport, or custom Item)
//   remain fully editable.

import { makeDraggable, positionModal } from "./uiManager.js";
import { loadItemDefinitions } from "./itemDefinitionsService.js";

/**
 * Initialise the marker‑form module.
 * @param {firebase.firestore.Firestore} db firestore instance
 * @returns {{ openEdit:Function, openCreate:Function, refreshPredefinedItems:Function }}
 */
export function initMarkerForm(db) {
  /* -------------------------------------------------- *
   * DOM handles
   * -------------------------------------------------- */
  const modal            = document.getElementById("edit-modal");
  const modalHandle      = document.getElementById("edit-modal-handle");
  const form             = document.getElementById("edit-form");
  const btnCancel        = document.getElementById("edit-cancel");

  const fldName          = document.getElementById("edit-name");
  const fldType          = document.getElementById("edit-type");
  const fldImageS        = document.getElementById("edit-image-small");
  const fldImageL        = document.getElementById("edit-image-big");
  const fldVideo         = document.getElementById("edit-video-url");
  const fldRarity        = document.getElementById("edit-rarity");
  const fldItemType      = document.getElementById("edit-item-type");
  const fldDescItem      = document.getElementById("edit-description");
  const fldDescNonItem   = document.getElementById("edit-description-non-item");

  const itemBlock        = document.getElementById("item-extra-fields");
  const nonItemBlock     = document.getElementById("non-item-description");
  const predefinedBlock  = document.getElementById("predefined-item-container");
  const predefinedDD     = document.getElementById("predefined-item-dropdown");

  const addLineBtn       = document.getElementById("add-extra-line");
  const linesWrap        = document.getElementById("extra-lines");

  makeDraggable(modal, modalHandle);

  /* -------------------------------------------------- *
   * Colour pickers
   * -------------------------------------------------- */
  function makePicker(sel) {
    return Pickr.create({
      el: sel, theme: "nano", default: "#E5E6E8",
      components: {
        preview: true, opacity: true, hue: true,
        interaction: { hex:true, rgba:true, input:true, save:true }
      }
    }).on("save", (_, p) => p.hide());
  }
  const pkName     = makePicker("#pickr-name");
  const pkRarity   = makePicker("#pickr-rarity");
  const pkType     = makePicker("#pickr-itemtype");
  const pkDescItem = makePicker("#pickr-desc-item");
  const pkDescNI   = makePicker("#pickr-desc-nonitem");

  const pickrs = [pkName, pkRarity, pkType, pkDescItem];

  /* -------------------------------------------------- *
   * Item Definitions
   * -------------------------------------------------- */
  let itemDefs = {};
  async function refreshPredefinedItems() {
    const defs = await loadItemDefinitions(db);
    itemDefs = Object.fromEntries(defs.map(d => [d.id, d]));
    predefinedDD.innerHTML = '<option value="">-- Select an item --</option>';
    defs.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.name;
      predefinedDD.appendChild(opt);
    });
  }
  refreshPredefinedItems();

  /* -------------------------------------------------- *
   * Extra‑info lines renderer
   * -------------------------------------------------- */
  let lines = [];
  function renderLines(readOnly = false) {
    linesWrap.innerHTML = "";
    lines.forEach((ln, i) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.style.marginBottom = "5px";

      const txt = document.createElement("input");
      txt.value = ln.text;
      txt.readOnly = readOnly;
      txt.style.background = "#E5E6E8";
      txt.style.color = "#000";
      txt.addEventListener("input", () => (lines[i].text = txt.value));

      const clr = document.createElement("div");
      clr.className = "color-btn";
      clr.style.marginLeft = "5px";
      clr.style.pointerEvents = readOnly ? "none" : "auto";
      clr.style.opacity = readOnly ? 0.4 : 1;

      const rm = document.createElement("button");
      rm.textContent = "x";
      rm.type = "button";
      rm.disabled = readOnly;
      rm.style.marginLeft = "5px";
      rm.addEventListener("click", () => {
        lines.splice(i, 1);
        renderLines(readOnly);
      });

      row.append(txt, clr, rm);
      linesWrap.appendChild(row);

      Pickr.create({
        el: clr, theme: "nano", default: ln.color || "#E5E6E8",
        components: {
          preview:true, opacity:true, hue:true,
          interaction:{ hex:true, rgba:true, input:true, save:true }
        }
      })
        .on("change", c => (lines[i].color = c.toHEXA().toString()))
        .on("save", (_, p) => p.hide())
        .setColor(ln.color || "#E5E6E8");
    });
  }

  addLineBtn.addEventListener("click", () => {
    lines.push({ text: "", color: "#E5E6E8" });
    renderLines(false);
  });

  /* -------------------------------------------------- *
   * Helpers: lock / unlock item fields
   * -------------------------------------------------- */
  function lockItemFields(yes) {
    const toggle = (el, on) => {
      el.disabled = on; el.readOnly = on;
      if (el.tagName === "SELECT") {
        el.style.pointerEvents = on ? "none" : "auto";
      }
    };
    [fldName, fldRarity, fldItemType, fldDescItem].forEach(el => toggle(el, yes));

    // Guard against Pickr not yet fully initialised
    pickrs.forEach(p => {
      const root = p?.getRoot?.();
      if (root) {
        root.style.pointerEvents = yes ? "none" : "auto";
        root.style.opacity = yes ? 0.4 : 1;
      }
    });

    addLineBtn.disabled = yes;
  }

  function switchSections(isItem) {
    itemBlock.style.display       = isItem ? "block" : "none";
    nonItemBlock.style.display    = isItem ? "none"  : "block";
    predefinedBlock.style.display = isItem ? "block" : "none";
  }

  function applyTypeUI() {
    const isItem = fldType.value === "Item";
    switchSections(isItem);
    lockItemFields(isItem);
    if (isItem) predefinedDD.value = "";
  }
  fldType.addEventListener("change", applyTypeUI);

  /* -------------------------------------------------- *
   * Fill from definition
   * -------------------------------------------------- */
  function fillFromDef(def) {
    fldName.value = def.name;
    pkName.setColor(def.nameColor || "#E5E6E8");

    fldRarity.value = def.rarity || "";
    pkRarity.setColor(def.rarityColor || "#E5E6E8");

    fldItemType.value = def.itemType || def.type || "";
    pkType.setColor(def.itemTypeColor || "#E5E6E8");

    fldDescItem.value = def.description || "";
    pkDescItem.setColor(def.descriptionColor || "#E5E6E8");

    fldImageS.value = def.imageSmall || "";
    fldImageL.value = def.imageBig   || "";

    lines = def.extraLines ? JSON.parse(JSON.stringify(def.extraLines)) : [];
    renderLines(true);
  }

  predefinedDD.addEventListener("change", () => {
    const d = itemDefs[predefinedDD.value];
    if (d) fillFromDef(d);
  });

  /* -------------------------------------------------- *
   * populate / harvest
   * -------------------------------------------------- */
  function populateForm(marker = { type: "Item" }) {
    fldType.value = marker.type || "Item";
    applyTypeUI();

    if (marker.type === "Item") {
      predefinedDD.value = marker.predefinedItemId || "";
      const def = itemDefs[marker.predefinedItemId];
      if (def) fillFromDef(def);
    } else {
      fldName.value = marker.name || "";
      pkName.setColor(marker.nameColor || "#E5E6E8");

      fldImageS.value = marker.imageSmall || "";
      fldImageL.value = marker.imageBig   || "";
      fldVideo.value  = marker.videoURL   || "";

      fldDescNonItem.value = marker.description || "";
      pkDescNI.setColor(marker.descriptionColor || "#E5E6E8");
    }
  }

  function harvestForm(coords) {
    const m = { type: fldType.value, coords };

    if (m.type === "Item") {
      const def = itemDefs[predefinedDD.value];
      if (def) {
        Object.assign(m, {
          predefinedItemId: def.id,
          name:             def.name,
          nameColor:        def.nameColor || "#E5E6E8",
          rarity:           def.rarity,
          rarityColor:      def.rarityColor || "#E5E6E8",
          itemType:         def.itemType || def.type,
          itemTypeColor:    def.itemTypeColor || "#E5E6E8",
          description:      def.description,
          descriptionColor: def.descriptionColor || "#E5E6E8",
          extraLines:       JSON.parse(JSON.stringify(def.extraLines || [])),
          imageSmall:       def.imageSmall,
          imageBig:         def.imageBig
        });
      }
    } else {
      m.name             = fldName.value || "New Marker";
      m.nameColor        = pkName.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      m.imageSmall       = fldImageS.value;
      m.imageBig         = fldImageL.value;
      m.videoURL         = fldVideo.value || "";
      m.description      = fldDescNonItem.value;
      m.descriptionColor = pkDescNI.getColor()?.toHEXA()?.toString() || "#E5E6E8";
    }
    return m;
  }

  /* -------------------------------------------------- *
   * openEdit / openCreate
   * -------------------------------------------------- */
  let submitCB = null;

  function openEdit(markerObj, data, clickEvt, onSave) {
    populateForm(data);
    positionModal(modal, clickEvt);
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

  function openCreate(coords, defaultType, clickEvt, onCreate) {
    populateForm({ type: defaultType || "Item" });
    positionModal(modal, clickEvt);
    modal.style.display = "block";

    if (submitCB) form.removeEventListener("submit", submitCB);
    submitCB = e => {
      e.preventDefault();
      onCreate(harvestForm(coords));
      modal.style.display = "none";
    };
    form.addEventListener("submit", submitCB);
  }

  /* -------------------------------------------------- */
  btnCancel.addEventListener("click", () => (modal.style.display = "none"));

  /* -------------------------------------------------- */
  return { openEdit, openCreate, refreshPredefinedItems };
}

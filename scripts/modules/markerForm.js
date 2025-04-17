// scripts/modules/markerForm.js
// Edit / Create Marker modal.  When a marker is linked to a predefined
// item, all item‑specific fields are read‑only and populated directly
// from the item library.

import { makeDraggable, positionModal } from "./uiManager.js";
import { formatRarity } from "./utils.js";
import { loadItemDefinitions } from "./itemDefinitionsService.js";

/**
 * Initialise the marker‑form module.
 * @param {firebase.firestore.Firestore} db Firestore instance
 * @returns {{ openEdit:Function, openCreate:Function, refreshPredefinedItems:Function }}
 */
export function initMarkerForm(db) {
  /* -------------------------------------------------- *
   *  DOM references
   * -------------------------------------------------- */
  const modal            = document.getElementById("edit-modal");
  const modalHandle      = document.getElementById("edit-modal-handle");
  const form             = document.getElementById("edit-form");
  const btnCancel        = document.getElementById("edit-cancel");
  const addExtraLineBtn  = document.getElementById("add-extra-line");
  const extraLinesWrap   = document.getElementById("extra-lines");

  const fldName          = document.getElementById("edit-name");
  const fldType          = document.getElementById("edit-type");
  const fldImageS        = document.getElementById("edit-image-small");
  const fldImageL        = document.getElementById("edit-image-big");
  const fldVideo         = document.getElementById("edit-video-url");
  const fldRarity        = document.getElementById("edit-rarity");
  const fldItemType      = document.getElementById("edit-item-type");
  const fldDescItem      = document.getElementById("edit-description");
  const fldDescNonItem   = document.getElementById("edit-description-non-item");

  const itemFieldsBlock  = document.getElementById("item-extra-fields");
  const nonItemDescBlock = document.getElementById("non-item-description");
  const predefinedBlock  = document.getElementById("predefined-item-container");
  const predefinedDD     = document.getElementById("predefined-item-dropdown");

  /* -------------------------------------------------- *
   *  Draggable modal
   * -------------------------------------------------- */
  makeDraggable(modal, modalHandle);

  /* -------------------------------------------------- *
   *  Colour pickers
   * -------------------------------------------------- */
  function mkPicker(sel) {
    return Pickr.create({
      el: sel,
      theme: "nano",
      default: "#E5E6E8",
      components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: { hex: true, rgba: true, input: true, save: true }
      }
    }).on("save", (_, p) => p.hide());
  }
  const pkName        = mkPicker("#pickr-name");
  const pkRarity      = mkPicker("#pickr-rarity");
  const pkItemType    = mkPicker("#pickr-itemtype");
  const pkDescItem    = mkPicker("#pickr-desc-item");
  const pkDescNonItem = mkPicker("#pickr-desc-nonitem");

  /* -------------------------------------------------- *
   *  Predefined‑item library
   * -------------------------------------------------- */
  let predefinedDefs = {};
  async function refreshPredefinedItems() {
    const list = await loadItemDefinitions(db);
    predefinedDefs = {};
    predefinedDD.innerHTML = '<option value="">-- Select an item --</option>';
    list.forEach(def => {
      predefinedDefs[def.id] = def;
      const opt = document.createElement("option");
      opt.value = def.id;
      opt.textContent = def.name;
      predefinedDD.appendChild(opt);
    });
  }
  refreshPredefinedItems();

  /* -------------------------------------------------- *
   *  Extra info lines
   * -------------------------------------------------- */
  let extraLines = [];
  function renderExtraLines(readOnly = false) {
    extraLinesWrap.innerHTML = "";
    extraLines.forEach((line, idx) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.style.marginBottom = "5px";

      const txt = document.createElement("input");
      txt.type = "text";
      txt.value = line.text;
      txt.style.background = "#E5E6E8";
      txt.style.color = "#000";
      txt.readOnly = readOnly;
      txt.addEventListener("input", () => {
        extraLines[idx].text = txt.value;
      });

      const colorBox = document.createElement("div");
      colorBox.className = "color-btn";
      colorBox.style.marginLeft = "5px";
      colorBox.style.pointerEvents = readOnly ? "none" : "auto";
      colorBox.style.opacity = readOnly ? 0.4 : 1;

      const rm = document.createElement("button");
      rm.type = "button";
      rm.textContent = "x";
      rm.style.marginLeft = "5px";
      rm.disabled = readOnly;
      rm.addEventListener("click", () => {
        extraLines.splice(idx, 1);
        renderExtraLines(readOnly);
      });

      row.appendChild(txt);
      row.appendChild(colorBox);
      row.appendChild(rm);
      extraLinesWrap.appendChild(row);

      Pickr.create({
        el: colorBox,
        theme: "nano",
        default: line.color || "#E5E6E8",
        components: {
          preview: true,
          opacity: true,
          hue: true,
          interaction: { hex: true, rgba: true, input: true, save: true }
        }
      })
        .on("change", c => {
          extraLines[idx].color = c.toHEXA().toString();
        })
        .on("save", (_, p) => p.hide())
        .setColor(line.color || "#E5E6E8");
    });
  }

  /* -------------------------------------------------- *
   *  UI mode toggles helpers
   * -------------------------------------------------- */
  const pickrs = [pkName, pkRarity, pkItemType, pkDescItem];

  function lockItemFields(isItem) {
    const lock = (ele, yes) => {
      ele.readOnly = yes;
      ele.disabled = yes;
      if (ele.tagName === "SELECT") ele.style.pointerEvents = yes ? "none" : "auto";
    };
    [fldName, fldRarity, fldItemType, fldDescItem].forEach(inp => lock(inp, isItem));

    // Safely iterate – skip any Pickr that isn't ready yet.
    pickrs.filter(Boolean).forEach(p => {
      const root = p.getRoot ? p.getRoot() : null;
      if (root) {
        root.style.pointerEvents = isItem ? "none" : "auto";
        root.style.opacity = isItem ? 0.4 : 1;
      }
    });

    addExtraLineBtn.disabled = isItem;
  }

  function showSections(isItem) {
    itemFieldsBlock.style.display  = isItem ? "block" : "none";
    nonItemDescBlock.style.display = isItem ? "none"  : "block";
    predefinedBlock.style.display  = isItem ? "block" : "none";
  }

  function applyTypeRules() {
    const isItem = fldType.value === "Item";
    showSections(isItem);
    lockItemFields(isItem);
    if (isItem) predefinedDD.value = "";
  }
  fldType.addEventListener("change", applyTypeRules);

  /* -------------------------------------------------- *
   *  Predefined dropdown autofill
   * -------------------------------------------------- */
  predefinedDD.addEventListener("change", () => {
    const def = predefinedDefs[predefinedDD.value];
    if (def) populateFromDefinition(def);
  });

  function populateFromDefinition(def) {
    fldName.value = def.name;
    pkName.setColor(def.nameColor || "#E5E6E8");

    fldRarity.value = def.rarity || "";
    pkRarity.setColor(def.rarityColor || "#E5E6E8");

    fldItemType.value = def.itemType || def.type || "";
    pkItemType.setColor(def.itemTypeColor || "#E5E6E8");

    fldDescItem.value = def.description || "";
    pkDescItem.setColor(def.descriptionColor || "#E5E6E8");

    fldImageS.value = def.imageSmall || "";
    fldImageL.value = def.imageBig   || "";

    extraLines = def.extraLines ? JSON.parse(JSON.stringify(def.extraLines)) : [];
    renderExtraLines(true); // read‑only
  }

  /* -------------------------------------------------- *
   *  Form populate / harvest
   * -------------------------------------------------- */
  function populateForm(marker) {
    fldType.value = marker.type || "Item";
    applyTypeRules();

    if (marker.type === "Item") {
      predefinedDD.value = marker.predefinedItemId || "";
      const def = predefinedDefs[marker.predefinedItemId];
      if (def) populateFromDefinition(def);
    } else {
      // Freeform marker
      fldName.value  = marker.name || "";
      pkName.setColor(marker.nameColor || "#E5E6E8");

      fldImageS.value = marker.imageSmall || "";
      fldImageL.value = marker.imageBig   || "";
      fldVideo.value  = marker.videoURL   || "";

      fldDescNonItem.value = marker.description || "";
      pkDescNonItem.setColor(marker.descriptionColor || "#E5E6E8");
    }
  }

  function harvestForm(coords) {
    const out = { type: fldType.value, coords };

    if (out.type === "Item") {
      const def = predefinedDefs[predefinedDD.value];
      if (def) {
        out.predefinedItemId = def.id;
        out.name             = def.name;
        out.nameColor        = def.nameColor        || "#E5E6E8";
        out.rarity           = def.rarity;
        out.rarityColor      = def.rarityColor      || "#E5E6E8";
        out.itemType         = def.itemType || def.type;
        out.itemTypeColor    = def.itemTypeColor    || "#E5E6E8";
        out.description      = def.description;
        out.descriptionColor = def.descriptionColor || "#E5E6E8";
        out.extraLines       = JSON.parse(JSON.stringify(def.extraLines || []));
        out.imageSmall       = def.imageSmall;
        out.imageBig         = def.imageBig;
      }
    } else {
      // Freeform marker
      out.name             = fldName.value || "New Marker";
      out.nameColor        = pkName.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      out.imageSmall       = fldImageS.value;
      out.imageBig         = fldImageL.value;
      out.videoURL         = fldVideo.value || "";
      out.description      = fldDescNonItem.value;
      out.descriptionColor = pkDescNonItem.getColor()?.toHEXA()?.toString() || "#E5E6E8";
    }
    return out;
  }

  /* -------------------------------------------------- *
   *  Modal openers
   * -------------------------------------------------- */
  let submitHandler = null;

  function openEdit(markerObj, data, clickEvt, onSave) {
    populateForm(data);
    positionModal(modal, clickEvt);
    modal.style.display = "block";

    if (submitHandler) form.removeEventListener("submit", submitHandler);
    submitHandler = (e) => {
      e.preventDefault();
      Object.assign(data, harvestForm(data.coords));
      onSave(data);
      modal.style.display = "none";
    };
    form.addEventListener("submit", submitHandler);
  }

  function openCreate(coords, defaultType, clickEvt, onCreate) {
    populateForm({ type: defaultType || "Item" });
    positionModal(modal, clickEvt);
    modal.style.display = "block";

    if (submitHandler) form.removeEventListener("submit", submitHandler);
    submitHandler

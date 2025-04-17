// scripts/modules/markerFormManager.js
//
// Encapsulates the Edit / Create Marker modal.
//
// Public API
// ──────────
//   initMarkerFormManager(db)
//   showEditForm(markerData, pos, onSave)
//   showCreateForm(latlng, defaults, pos, onSave)
//   refreshPredefinedItems()       ← call after you add / edit / delete defs
//

import { formatRarity }              from "./utils.js";
import { loadItemDefinitions }       from "./itemDefinitionsService.js";
import { makeDraggable, hideContextMenu } from "./uiManager.js";

// Firestore handle and cached item‑definitions -----------------------------
let dbInstance        = null;
let itemDefsCache     = [];   // full array from Firestore
let itemDefsByIdCache = {};   // id → object

// DOM refs ------------------------------------------------------------------
const el = {};    // populated in init()

// Pickr instances -----------------------------------------------------------
const pickr = {};

function createPickr(selector) {
  return Pickr.create({
    el: selector,
    theme: "nano",
    default: "#E5E6E8",
    components: {
      preview: true, opacity: true, hue: true,
      interaction: { hex: true, rgba: true, input: true, save: true }
    }
  }).on("save", (_, p) => p.hide());
}

// working‑state while modal open -------------------------------------------
let extraLines   = [];      // [{text,color}]
let saveCb       = null;    // callback we call on submit
let mode         = null;    // "edit" | "create"
let currentData  = null;    // marker object being edited
let currentLatLng= null;    // for create

// ────────────────────────────────────────────────────────────────────────────
// Initialiser
// ────────────────────────────────────────────────────────────────────────────
export function initMarkerFormManager(db) {
  if (dbInstance) return;   // already done
  dbInstance = db;

  // cache DOM nodes
  const ids = [
    ["modal"     , "edit-modal"],
    ["handle"    , "edit-modal-handle"],
    ["form"      , "edit-form"],
    ["name"      , "edit-name"],
    ["type"      , "edit-type"],
    ["predefWrap", "predefined-item-container"],
    ["predefSel" , "predefined-item-dropdown"],
    ["itemFields", "item-extra-fields"],
    ["nonItem"   , "non-item-description"],
    ["rarity"    , "edit-rarity"],
    ["itemType"  , "edit-item-type"],
    ["descItem"  , "edit-description"],
    ["descNon"   , "edit-description-non-item"],
    ["extraWrap" , "extra-lines"],
    ["addExtra"  , "add-extra-line"],
    ["imgSmall"  , "edit-image-small"],
    ["imgBig"    , "edit-image-big"],
    ["videoURL"  , "edit-video-url"],
    ["cancelBtn" , "edit-cancel"]
  ];
  ids.forEach(([k, id]) => (el[k] = document.getElementById(id)));

  // draggable
  makeDraggable(el.modal, el.handle);

  // Pickrs
  pickr.name     = createPickr("#pickr-name");
  pickr.rarity   = createPickr("#pickr-rarity");
  pickr.itemType = createPickr("#pickr-itemtype");
  pickr.descItem = createPickr("#pickr-desc-item");
  pickr.descNon  = createPickr("#pickr-desc-nonitem");

  // listeners
  el.type.addEventListener("change", updateVisibility);
  el.predefSel.addEventListener("change", applyPredefinedSelection);
  el.addExtra.addEventListener("click", () => {
    extraLines.push({ text: "", color: "#E5E6E8" });
    renderExtraLines();
  });
  el.cancelBtn.addEventListener("click", hideForm);
  el.form.addEventListener("submit", onSubmit);
}

// ────────────────────────────────────────────────────────────────────────────
// Predefined‑items helpers
// ────────────────────────────────────────────────────────────────────────────
async function populatePredefs() {
  if (!dbInstance) return;
  itemDefsCache     = await loadItemDefinitions(dbInstance);
  itemDefsByIdCache = {};
  el.predefSel.innerHTML = '<option value="">-- Select an item --</option>';

  itemDefsCache.forEach(d => {
    itemDefsByIdCache[d.id] = d;
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.name;
    el.predefSel.appendChild(opt);
  });
}

// exported so script.js can call it after CRUD on definitions
export async function refreshPredefinedItems() {
  await populatePredefs();
}

// apply selected definition to the form
function applyPredefinedSelection() {
  const id = el.predefSel.value;
  if (!id) return;
  const d = itemDefsByIdCache[id];
  if (!d) return;

  el.name.value = d.name || "";
  pickr.name.setColor(d.nameColor || "#E5E6E8");

  el.rarity.value = d.rarity || "";
  pickr.rarity.setColor(d.rarityColor || "#E5E6E8");

  el.itemType.value = d.itemType || d.type || "";
  pickr.itemType.setColor(d.itemTypeColor || "#E5E6E8");

  el.descItem.value = d.description || "";
  pickr.descItem.setColor(d.descriptionColor || "#E5E6E8");

  extraLines = d.extraLines ? JSON.parse(JSON.stringify(d.extraLines)) : [];
  renderExtraLines();

  el.imgSmall.value = d.imageSmall || "";
  el.imgBig.value   = d.imageBig   || "";
}

// ────────────────────────────────────────────────────────────────────────────
// UI helpers
// ────────────────────────────────────────────────────────────────────────────
function updateVisibility() {
  if (el.type.value === "Item") {
    el.itemFields.style.display = "block";
    el.nonItem.style.display    = "none";
    el.predefWrap.style.display = "block";
    populatePredefs();
  } else {
    el.itemFields.style.display = "none";
    el.nonItem.style.display    = "block";
    el.predefWrap.style.display = "none";
    // clear item‑only state
    extraLines = [];
    renderExtraLines();
  }
}

// render extraLines array into the DOM
function renderExtraLines() {
  el.extraWrap.innerHTML = "";
  extraLines.forEach((line, idx) => {
    const row  = document.createElement("div");
    row.className = "field-row";
    const inp  = document.createElement("input");
    inp.type  = "text";
    inp.value = line.text;
    inp.addEventListener("input", e => (extraLines[idx].text = e.target.value));

    const clr  = document.createElement("div");
    clr.className = "color-btn";

    const rm   = document.createElement("button");
    rm.type = "button";
    rm.textContent = "x";
    rm.addEventListener("click", () => {
      extraLines.splice(idx, 1);
      renderExtraLines();
    });

    row.append(inp, clr, rm);
    el.extraWrap.appendChild(row);

    const p = Pickr.create({
      el: clr,
      theme: "nano",
      default: line.color || "#E5E6E8",
      components: {
        preview: true, opacity: true, hue: true,
        interaction: { hex: true, rgba: true, input: true, save: true }
      }
    })
      .on("change", c => (extraLines[idx].color = c.toHEXA().toString()))
      .on("save",  (_,p)=> p.hide());
    p.setColor(line.color);
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Public: open modal for editing
// ────────────────────────────────────────────────────────────────────────────
export function showEditForm(markerData, pos, onSave) {
  mode        = "edit";
  currentData = markerData;
  currentLatLng = null;
  saveCb      = onSave;

  // populate fields
  extraLines = markerData.extraLines ? JSON.parse(JSON.stringify(markerData.extraLines)) : [];
  el.name.value = markerData.name || "";
  pickr.name.setColor(markerData.nameColor || "#E5E6E8");

  el.type.value = markerData.type;
  el.imgSmall.value = markerData.imageSmall || "";
  el.imgBig.value   = markerData.imageBig   || "";
  el.videoURL.value = markerData.videoURL   || "";
  el.predefSel.value= markerData.predefinedItemId || "";
  updateVisibility();

  if (markerData.type === "Item") {
    el.rarity.value  = markerData.rarity || "";
    pickr.rarity.setColor(markerData.rarityColor || "#E5E6E8");
    el.itemType.value = markerData.itemType || "Crafting Material";
    pickr.itemType.setColor(markerData.itemTypeColor || "#E5E6E8");
    el.descItem.value = markerData.description || "";
    pickr.descItem.setColor(markerData.descriptionColor || "#E5E6E8");
  } else {
    el.descNon.value = markerData.description || "";
    pickr.descNon.setColor(markerData.descriptionColor || "#E5E6E8");
  }
  renderExtraLines();

  // position + show
  el.modal.style.left = (pos.x - el.modal.offsetWidth + 10) + "px";
  el.modal.style.top  = (pos.y - el.modal.offsetHeight / 2) + "px";
  el.modal.style.display = "block";
  hideContextMenu();
}

// ────────────────────────────────────────────────────────────────────────────
// Public: open modal for creating a new marker
// ────────────────────────────────────────────────────────────────────────────
export function showCreateForm(latlng, defaults, pos, onSave) {
  mode         = "create";
  currentData  = { ...defaults };
  currentLatLng= latlng;
  saveCb       = onSave;

  extraLines = [];
  el.name.value = defaults.name || "";
  pickr.name.setColor("#E5E6E8");
  el.type.value = defaults.type || "Item";
  el.imgSmall.value = "";
  el.imgBig.value   = "";
  el.videoURL.value = "";
  el.predefSel.value = "";
  updateVisibility();

  el.rarity.value = "";
  pickr.rarity.setColor("#E5E6E8");
  el.itemType.value = "Crafting Material";
  pickr.itemType.setColor("#E5E6E8");
  el.descItem.value = ""; pickr.descItem.setColor("#E5E6E8");
  el.descNon.value  = ""; pickr.descNon.setColor("#E5E6E8");
  renderExtraLines();

  el.modal.style.left = (pos.x - el.modal.offsetWidth + 10) + "px";
  el.modal.style.top  = (pos.y - el.modal.offsetHeight / 2) + "px";
  el.modal.style.display = "block";
  hideContextMenu();
}

// ────────────────────────────────────────────────────────────────────────────
// Submit handler
// ────────────────────────────────────────────────────────────────────────────
function onSubmit(e) {
  e.preventDefault();
  if (!saveCb) return;

  // start with existing data in edit mode, fresh object in create mode
  const d = mode === "edit" ? { ...currentData } : {};

  d.name      = el.name.value.trim() || "New Marker";
  d.nameColor = pickr.name.getColor()?.toHEXA()?.toString() || "#E5E6E8";
  d.type      = el.type.value;
  d.imageSmall= el.imgSmall.value.trim();
  d.imageBig  = el.imgBig.value.trim();
  d.videoURL  = el.videoURL.value.trim();
  d.predefinedItemId = el.predefSel.value || null;

  // coords only on create
  if (mode === "create") d.coords = [currentLatLng.lat, currentLatLng.lng];

  if (d.type === "Item") {
    d.rarity       = formatRarity(el.rarity.value);
    d.rarityColor  = pickr.rarity.getColor()?.toHEXA()?.toString() || "#E5E6E8";
    d.itemType     = el.itemType.value;
    d.itemTypeColor= pickr.itemType.getColor()?.toHEXA()?.toString() || "#E5E6E8";
    d.description  = el.descItem.value;
    d.descriptionColor = pickr.descItem.getColor()?.toHEXA()?.toString() || "#E5E6E8";
    d.extraLines   = JSON.parse(JSON.stringify(extraLines));
  } else {
    d.description  = el.descNon.value;
    d.descriptionColor = pickr.descNon.getColor()?.toHEXA()?.toString() || "#E5E6E8";
    // remove any leftovers from when it used to be an Item
    delete d.rarity; delete d.rarityColor;
    delete d.itemType; delete d.itemTypeColor;
    delete d.extraLines;
  }

  hideForm();
  saveCb(d);
}

// ────────────────────────────────────────────────────────────────────────────
// Close modal & clean state
// ────────────────────────────────────────────────────────────────────────────
function hideForm() {
  el.modal.style.display = "none";
  saveCb      = null;
  currentData = null;
  extraLines  = [];
}

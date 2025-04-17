// scripts/modules/markerFormManager.js
//
// Manages the Edit / Create Marker modal.

import { formatRarity }                    from "./utils.js";
import { loadItemDefinitions }             from "./itemDefinitionsService.js";
import { makeDraggable, hideContextMenu }  from "./uiManager.js";

// ────────────────────────────────────────────────────────────────────────────
// Config
// ────────────────────────────────────────────────────────────────────────────
const CURSOR_GAP = 10;   // constant gap between cursor and modal’s right edge

// ────────────────────────────────────────────────────────────────────────────
// State
// ────────────────────────────────────────────────────────────────────────────
let dbInstance = null;
let itemDefs   = {};     // id → definition (populated once)

const el    = {};        // DOM refs
const pickr = {};        // Pickr refs

let extraLines     = [];
let saveCallback   = null;
let mode           = null; // "edit" | "create"
let currentData    = null;
let currentLatLng  = null;

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
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

/** Position modal so its right edge is CURSOR_GAP px left of the cursor. */
function positionModal(pos) {
  el.modal.style.display  = "block";
  el.modal.style.left     = (pos.x + CURSOR_GAP) + "px";
  el.modal.style.top      = pos.y + "px";
  el.modal.style.transform= "translate(-100%,-50%)";   // anchor right & centre
  hideContextMenu();
}

/** Load and cache item definitions the first time the form needs them. */
async function ensureItemDefs() {
  if (!dbInstance || Object.keys(itemDefs).length) return;
  const defs = await loadItemDefinitions(dbInstance);
  defs.forEach(d => (itemDefs[d.id] = d));
}

/** (Re)fill predefined dropdown */
async function populatePredefDropdown() {
  await ensureItemDefs();
  el.predefSel.innerHTML = '<option value="">-- Select an item --</option>';
  Object.values(itemDefs).forEach(def => {
    const opt = document.createElement("option");
    opt.value = def.id; opt.textContent = def.name;
    el.predefSel.appendChild(opt);
  });
}

export async function refreshPredefinedItems() {
  itemDefs = {};   // clear cache so next call fetches fresh list
  await populatePredefDropdown();
}

// ────────────────────────────────────────────────────────────────────────────
// Initialiser
// ────────────────────────────────────────────────────────────────────────────
export function initMarkerFormManager(db) {
  if (dbInstance) return;      // already initialised
  dbInstance = db;

  // --- DOM refs
  [
    ["modal","edit-modal"],["handle","edit-modal-handle"],["form","edit-form"],
    ["name","edit-name"],["type","edit-type"],
    ["preWrap","predefined-item-container"],["preSel","predefined-item-dropdown"],
    ["itemFields","item-extra-fields"],["nonItem","non-item-description"],
    ["rarity","edit-rarity"],["itemType","edit-item-type"],
    ["descItem","edit-description"],["descNon","edit-description-non-item"],
    ["extraWrap","extra-lines"],["addLine","add-extra-line"],
    ["imgS","edit-image-small"],["imgL","edit-image-big"],
    ["video","edit-video-url"],["cancel","edit-cancel"]
  ].forEach(([k,id]) => (el[k] = document.getElementById(id)));

  // --- draggable
  makeDraggable(el.modal, el.handle);

  // --- Pickrs
  pickr.name     = createPickr("#pickr-name");
  pickr.rarity   = createPickr("#pickr-rarity");
  pickr.itemType = createPickr("#pickr-itemtype");
  pickr.descItem = createPickr("#pickr-desc-item");
  pickr.descNon  = createPickr("#pickr-desc-nonitem");

  // --- events
  el.type.addEventListener("change", updateVisibility);
  el.preSel.addEventListener("change", applyDefinitionToForm);
  el.addLine.addEventListener("click", () => {
    extraLines.push({ text:"", color:"#E5E6E8" }); renderExtra();
  });
  el.cancel.addEventListener("click", hideForm);
  el.form.addEventListener("submit", handleSubmit);
}

// ────────────────────────────────────────────────────────────────────────────
// UI Functions
// ────────────────────────────────────────────────────────────────────────────
function renderExtra() {
  el.extraWrap.innerHTML = "";
  extraLines.forEach((ln, i) => {
    const row = document.createElement("div"); row.className = "field-row";
    const t   = document.createElement("input"); t.type="text"; t.value=ln.text;
    t.addEventListener("input", e => extraLines[i].text = e.target.value);
    const box = document.createElement("div"); box.className="color-btn";
    const rm  = document.createElement("button"); rm.textContent="x";
    rm.addEventListener("click", ()=>{extraLines.splice(i,1); renderExtra();});
    row.append(t, box, rm); el.extraWrap.appendChild(row);

    const p = Pickr.create({
      el: box, theme:"nano", default:ln.color,
      components:{preview:true,opacity:true,hue:true,interaction:{hex:true,rgba:true,input:true,save:true}}
    })
      .on("change", c => extraLines[i].color = c.toHEXA().toString())
      .on("save",   (_,p)=> p.hide());
    p.setColor(ln.color);
  });
}

function updateVisibility() {
  const isItem = el.type.value === "Item";
  el.itemFields.style.display = isItem ? "block" : "none";
  el.nonItem.style.display    = isItem ? "none"  : "block";
  el.preWrap.style.display    = isItem ? "block" : "none";
  if (isItem) { populatePredefDropdown(); }
  else { extraLines = []; renderExtra(); }
}

function applyDefinitionToForm() {
  const def = itemDefs[ el.preSel.value ];
  if (!def) return;
  el.name.value = def.name || "";         pickr.name.setColor(def.nameColor||"#E5E6E8");
  el.rarity.value = def.rarity || "";     pickr.rarity.setColor(def.rarityColor||"#E5E6E8");
  el.itemType.value = def.itemType || def.type || "";
  pickr.itemType.setColor(def.itemTypeColor||"#E5E6E8");
  el.descItem.value = def.description || "";
  pickr.descItem.setColor(def.descriptionColor||"#E5E6E8");
  extraLines = def.extraLines ? JSON.parse(JSON.stringify(def.extraLines)) : [];
  renderExtra();
  el.imgS.value = def.imageSmall || ""; el.imgL.value = def.imageBig || "";
}

// ────────────────────────────────────────────────────────────────────────────
// Public: open modal for editing
// ────────────────────────────────────────────────────────────────────────────
export function showEditForm(data, pos, onSave) {
  mode = "edit"; currentData = data; saveCallback = onSave;

  // fill form
  extraLines = data.extraLines ? JSON.parse(JSON.stringify(data.extraLines)) : [];
  el.name.value = data.name || "";     pickr.name.setColor(data.nameColor||"#E5E6E8");
  el.type.value = data.type;
  el.imgS.value = data.imageSmall||""; el.imgL.value = data.imageBig||"";
  el.video.value= data.videoURL || ""; el.preSel.value = data.predefinedItemId || "";
  updateVisibility();

  if (data.type === "Item") {
    el.rarity.value = data.rarity || ""; pickr.rarity.setColor(data.rarityColor||"#E5E6E8");
    el.itemType.value = data.itemType || "Crafting Material";
    pickr.itemType.setColor(data.itemTypeColor||"#E5E6E8");
    el.descItem.value = data.description || "";
    pickr.descItem.setColor(data.descriptionColor||"#E5E6E8");
  } else {
    el.descNon.value = data.description || "";
    pickr.descNon.setColor(data.descriptionColor||"#E5E6E8");
  }
  renderExtra();
  positionModal(pos);
}

// ────────────────────────────────────────────────────────────────────────────
// Public: open modal for creating
// ────────────────────────────────────────────────────────────────────────────
export function showCreateForm(latlng, defaults, pos, onSave) {
  mode = "create"; currentLatLng = latlng; currentData = { ...defaults }; saveCallback = onSave;

  extraLines = [];        el.name.value = defaults.name || "";     pickr.name.setColor("#E5E6E8");
  el.type.value = defaults.type || "Item";
  el.imgS.value = "";      el.imgL.value = "";      el.video.value = ""; el.preSel.value = "";
  updateVisibility();

  el.rarity.value=""; pickr.rarity.setColor("#E5E6E8");
  el.itemType.value="Crafting Material"; pickr.itemType.setColor("#E5E6E8");
  el.descItem.value=""; pickr.descItem.setColor("#E5E6E8");
  el.descNon.value ="";
  pickr.descNon.setColor("#E5E6E8");
  renderExtra();
  positionModal(pos);
}

// ────────────────────────────────────────────────────────────────────────────
// Submit & close
// ────────────────────────────────────────────────────────────────────────────
function handleSubmit(e) {
  e.preventDefault(); if (!saveCallback) return;
  const d = mode === "edit" ? { ...currentData } : {};
  d.name      = el.name.value.trim() || "New Marker";
  d.nameColor = pickr.name.getColor()?.toHEXA()?.toString() || "#E5E6E8";
  d.type      = el.type.value;
  d.imageSmall= el.imgS.value.trim(); d.imageBig   = el.imgL.value.trim();
  d.videoURL  = el.video.value.trim(); d.predefinedItemId = el.preSel.value || null;
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
    d.description      = el.descNon.value;
    d.descriptionColor = pickr.descNon.getColor()?.toHEXA()?.toString() || "#E5E6E8";
    delete d.rarity; delete d.rarityColor; delete d.itemType; delete d.itemTypeColor; delete d.extraLines;
  }
  hideForm(); saveCallback(d);
}

function hideForm() {
  el.modal.style.display = "none";
  saveCallback = null; currentData = null; extraLines = [];
}

// scripts/modules/markerFormManager.js
//
// Manages the Edit / Create Marker modal.
//

import { formatRarity }              from "./utils.js";
import { loadItemDefinitions }       from "./itemDefinitionsService.js";
import { makeDraggable, hideContextMenu } from "./uiManager.js";

// ---------------------------------------------------------------------------
// State & caches
// ---------------------------------------------------------------------------
let dbInstance        = null;
let itemDefsCache     = [];
let itemDefsByIdCache = {};

const el = {};       // DOM elements
const pickr = {};    // Pickr instances

let extraLines   = [];
let saveCb       = null;
let mode         = null;  // "edit" | "create"
let currentData  = null;
let currentLatLng= null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

/** Position modal so it opens just left of the cursor. */
function positionModal(pos) {
  el.modal.style.display = "block";               // make it visible first
  const w = el.modal.offsetWidth  || 400;         // fallback sizes if 0
  const h = el.modal.offsetHeight || 300;
  el.modal.style.left = (pos.x - w + 10) + "px";
  el.modal.style.top  = (pos.y - h / 2) + "px";
  hideContextMenu();
}

// ---------------------------------------------------------------------------
// Initialiser
// ---------------------------------------------------------------------------
export function initMarkerFormManager(db) {
  if (dbInstance) return;
  dbInstance = db;

  // DOM cache
  [
    ["modal","edit-modal"],["handle","edit-modal-handle"],["form","edit-form"],
    ["name","edit-name"],["type","edit-type"],
    ["predefWrap","predefined-item-container"],["predefSel","predefined-item-dropdown"],
    ["itemFields","item-extra-fields"],["nonItem","non-item-description"],
    ["rarity","edit-rarity"],["itemType","edit-item-type"],
    ["descItem","edit-description"],["descNon","edit-description-non-item"],
    ["extraWrap","extra-lines"],["addExtra","add-extra-line"],
    ["imgSmall","edit-image-small"],["imgBig","edit-image-big"],
    ["videoURL","edit-video-url"],["cancelBtn","edit-cancel"]
  ].forEach(([k,id])=> el[k]=document.getElementById(id));

  // draggable
  makeDraggable(el.modal, el.handle);

  // Pickrs
  pickr.name     = createPickr("#pickr-name");
  pickr.rarity   = createPickr("#pickr-rarity");
  pickr.itemType = createPickr("#pickr-itemtype");
  pickr.descItem = createPickr("#pickr-desc-item");
  pickr.descNon  = createPickr("#pickr-desc-nonitem");

  // events
  el.type.addEventListener("change", updateVisibility);
  el.predefSel.addEventListener("change", applyPredefinedSelection);
  el.addExtra.addEventListener("click", () => {
    extraLines.push({ text:"", color:"#E5E6E8" }); renderExtraLines();
  });
  el.cancelBtn.addEventListener("click", hideForm);
  el.form.addEventListener("submit", onSubmit);
}

// ---------------------------------------------------------------------------
// Predefined items
// ---------------------------------------------------------------------------
async function populatePredefs() {
  if (!dbInstance) return;
  itemDefsCache = await loadItemDefinitions(dbInstance);
  itemDefsByIdCache = {};
  el.predefSel.innerHTML = '<option value="">-- Select an item --</option>';
  itemDefsCache.forEach(d=>{
    itemDefsByIdCache[d.id]=d;
    const opt=document.createElement("option");
    opt.value=d.id; opt.textContent=d.name; el.predefSel.appendChild(opt);
  });
}
export async function refreshPredefinedItems() { await populatePredefs(); }

function applyPredefinedSelection() {
  const d=itemDefsByIdCache[ el.predefSel.value ];
  if (!d) return;
  el.name.value=d.name||"";          pickr.name.setColor(d.nameColor||"#E5E6E8");
  el.rarity.value=d.rarity||"";      pickr.rarity.setColor(d.rarityColor||"#E5E6E8");
  el.itemType.value=d.itemType||d.type||""; pickr.itemType.setColor(d.itemTypeColor||"#E5E6E8");
  el.descItem.value=d.description||""; pickr.descItem.setColor(d.descriptionColor||"#E5E6E8");
  extraLines=d.extraLines?JSON.parse(JSON.stringify(d.extraLines)):[];
  renderExtraLines();
  el.imgSmall.value=d.imageSmall||""; el.imgBig.value=d.imageBig||"";
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------
function updateVisibility() {
  if (el.type.value==="Item") {
    el.itemFields.style.display="block";
    el.nonItem.style.display="none";
    el.predefWrap.style.display="block";
    populatePredefs();
  } else {
    el.itemFields.style.display="none";
    el.nonItem.style.display="block";
    el.predefWrap.style.display="none";
    extraLines=[]; renderExtraLines();
  }
}

function renderExtraLines() {
  el.extraWrap.innerHTML="";
  extraLines.forEach((ln,idx)=>{
    const row=document.createElement("div"); row.className="field-row";
    const inp=document.createElement("input"); inp.type="text"; inp.value=ln.text;
    inp.addEventListener("input",e=>extraLines[idx].text=e.target.value);
    const clr=document.createElement("div"); clr.className="color-btn";
    const rm=document.createElement("button"); rm.textContent="x";
    rm.addEventListener("click",()=>{extraLines.splice(idx,1); renderExtraLines();});
    row.append(inp,clr,rm); el.extraWrap.appendChild(row);
    const p=Pickr.create({
      el:clr, theme:"nano", default:ln.color||"#E5E6E8",
      components:{preview:true,opacity:true,hue:true,interaction:{hex:true,rgba:true,input:true,save:true}}
    })
      .on("change",c=>extraLines[idx].color=c.toHEXA().toString())
      .on("save",(_,p)=>p.hide());
    p.setColor(ln.color);
  });
}

// ---------------------------------------------------------------------------
// Public: open modal for editing
// ---------------------------------------------------------------------------
export function showEditForm(markerData, pos, onSave) {
  mode="edit"; currentData=markerData; currentLatLng=null; saveCb=onSave;

  extraLines=markerData.extraLines?JSON.parse(JSON.stringify(markerData.extraLines)):[];
  el.name.value=markerData.name||"";   pickr.name.setColor(markerData.nameColor||"#E5E6E8");
  el.type.value=markerData.type;
  el.imgSmall.value=markerData.imageSmall||""; el.imgBig.value=markerData.imageBig||"";
  el.videoURL.value=markerData.videoURL||""; el.predefSel.value=markerData.predefinedItemId||"";
  updateVisibility();

  if (markerData.type==="Item") {
    el.rarity.value=markerData.rarity||""; pickr.rarity.setColor(markerData.rarityColor||"#E5E6E8");
    el.itemType.value=markerData.itemType||"Crafting Material"; pickr.itemType.setColor(markerData.itemTypeColor||"#E5E6E8");
    el.descItem.value=markerData.description||""; pickr.descItem.setColor(markerData.descriptionColor||"#E5E6E8");
  } else {
    el.descNon.value=markerData.description||""; pickr.descNon.setColor(markerData.descriptionColor||"#E5E6E8");
  }
  renderExtraLines();
  positionModal(pos);
}

// ---------------------------------------------------------------------------
// Public: open modal for creating
// ---------------------------------------------------------------------------
export function showCreateForm(latlng, defaults, pos, onSave) {
  mode="create"; currentData={...defaults}; currentLatLng=latlng; saveCb=onSave;

  extraLines=[]; el.name.value=defaults.name||""; pickr.name.setColor("#E5E6E8");
  el.type.value=defaults.type||"Item"; el.imgSmall.value=""; el.imgBig.value=""; el.videoURL.value="";
  el.predefSel.value=""; updateVisibility();

  el.rarity.value=""; pickr.rarity.setColor("#E5E6E8");
  el.itemType.value="Crafting Material"; pickr.itemType.setColor("#E5E6E8");
  el.descItem.value=""; pickr.descItem.setColor("#E5E6E8");
  el.descNon.value=""; pickr.descNon.setColor("#E5E6E8");
  renderExtraLines();
  positionModal(pos);
}

// ---------------------------------------------------------------------------
// Submit & close
// ---------------------------------------------------------------------------
function onSubmit(e) {
  e.preventDefault(); if (!saveCb) return;
  const d= mode==="edit" ? {...currentData} : {};
  d.name=el.name.value.trim()||"New Marker";
  d.nameColor=pickr.name.getColor()?.toHEXA()?.toString()||"#E5E6E8";
  d.type=el.type.value;
  d.imageSmall=el.imgSmall.value.trim(); d.imageBig=el.imgBig.value.trim();
  d.videoURL=el.videoURL.value.trim(); d.predefinedItemId=el.predefSel.value||null;
  if (mode==="create") d.coords=[currentLatLng.lat,currentLatLng.lng];

  if (d.type==="Item") {
    d.rarity=formatRarity(el.rarity.value); d.rarityColor=pickr.rarity.getColor()?.toHEXA()?.toString()||"#E5E6E8";
    d.itemType=el.itemType.value; d.itemTypeColor=pickr.itemType.getColor()?.toHEXA()?.toString()||"#E5E6E8";
    d.description=el.descItem.value; d.descriptionColor=pickr.descItem.getColor()?.toHEXA()?.toString()||"#E5E6E8";
    d.extraLines=JSON.parse(JSON.stringify(extraLines));
  } else {
    d.description=el.descNon.value; d.descriptionColor=pickr.descNon.getColor()?.toHEXA()?.toString()||"#E5E6E8";
    delete d.rarity; delete d.rarityColor; delete d.itemType; delete d.itemTypeColor; delete d.extraLines;
  }
  hideForm(); saveCb(d);
}

function hideForm() {
  el.modal.style.display="none";
  saveCb=null; currentData=null; extraLines=[];
}

// scripts/script.js
import { initializeMap } from "./modules/map.js";
import {
  makeDraggable,
  showContextMenu,
  positionModal,
  attachContextMenuHider,
  attachRightClickCancel
} from "./modules/uiManager.js";
import {
  initializeFirebase,
  loadMarkers,
  addMarker as firebaseAddMarker,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "./modules/firebaseService.js";
import { createMarker, createPopupContent } from "./modules/markerManager.js";
import { formatRarity } from "./modules/utils.js";
import { loadItemDefinitions } from "./modules/itemDefinitionsService.js";   // ← RESTORED
import { initItemDefinitionsModal } from "./modules/itemDefinitionsModal.js";
import { setupSidebar } from "./modules/sidebarManager.js";

// Global store for predefined item definitions
let predefinedItemDefs = {};

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Script loaded!");

  /* ----------  DOM (sidebar handled elsewhere)  ---------- */
  const editModal               = document.getElementById("edit-modal");
  const editModalHandle         = document.getElementById("edit-modal-handle");
  const editForm                = document.getElementById("edit-form");
  const editName                = document.getElementById("edit-name");
  const editType                = document.getElementById("edit-type");
  const editImageSmall          = document.getElementById("edit-image-small");
  const editImageBig            = document.getElementById("edit-image-big");
  const editVideoURL            = document.getElementById("edit-video-url");
  const itemExtraFields         = document.getElementById("item-extra-fields");
  const editRarity              = document.getElementById("edit-rarity");
  const editItemType            = document.getElementById("edit-item-type");
  const editDescription         = document.getElementById("edit-description");
  const nonItemDescription      = document.getElementById("edit-description-non-item");
  const extraLinesContainer     = document.getElementById("extra-lines");
  const predefinedItemContainer = document.getElementById("predefined-item-container");
  const predefinedItemDropdown  = document.getElementById("predefined-item-dropdown");

  /* ----------  Firebase  ---------- */
  const db = initializeFirebase({
    apiKey: "AIzaSyDwEdPN5MB8YAuM_jb0K1iXfQ-tGQ",
    authDomain: "vbmap-cc834.firebaseapp.com",
    projectId: "vbmap-cc834",
    storageBucket: "vbmap-cc834.firebasestorage.app",
    messagingSenderId: "244112699360",
    appId: "1:244112699360:web:95f50adb6e10b438238585",
    measurementId: "G-7FDNWLRM95"
  });

  /* ----------  Map & layers  ---------- */
  const { map } = initializeMap();
  const itemLayer = L.markerClusterGroup();
  const layers = {
    "Door":              L.layerGroup(),
    "Extraction Portal": L.layerGroup(),
    "Item":              itemLayer,
    "Teleport":          L.layerGroup()
  };
  Object.values(layers).forEach(l => l.addTo(map));

  /* ----------  Sidebar collapse & search  ---------- */
  const allMarkers = [];
  setupSidebar(map, layers, allMarkers);

  /* ----------  Item‑definitions modal  ---------- */
  const { openModal: openItemModal } = initItemDefinitionsModal(db, () => {
    if (editType.value === "Item") populatePredefinedItemsDropdown();
  });

  /* ----------  Copy‑paste state  ---------- */
  let copiedMarkerData = null;
  let pasteMode = false;
  attachContextMenuHider();
  attachRightClickCancel(() => { pasteMode = false; copiedMarkerData = null; });

  /* ----------  Draggable Edit‑Modal ---------- */
  makeDraggable(editModal, editModalHandle);

  /* ----------  Video popup ---------- */
  const videoPopup   = document.getElementById("video-popup");
  const videoPlayer  = document.getElementById("video-player");
  const videoSource  = document.getElementById("video-source");
  document.getElementById("video-close").addEventListener("click", () => {
    videoPopup.style.display = "none"; videoPlayer.pause();
  });
  function openVideoPopup(x, y, url) {
    videoSource.src = url; videoPlayer.load();
    videoPopup.style.left = `${x}px`; videoPopup.style.top = `${y}px`;
    videoPopup.style.display = "block";
  }
  window.openVideoPopup = openVideoPopup;

  /* ----------  Pickr helpers ---------- */
  function createPicker(sel) {
    return Pickr.create({
      el: sel, theme: "nano", default: "#E5E6E8",
      components:{ preview:true,opacity:true,hue:true,
        interaction:{ hex:true,rgba:true,input:true,save:true } }
    }).on("save",(_,p)=>p.hide());
  }
  const pickrName        = createPicker("#pickr-name");
  const pickrRarity      = createPicker("#pickr-rarity");
  const pickrItemType    = createPicker("#pickr-itemtype");
  const pickrDescItem    = createPicker("#pickr-desc-item");
  const pickrDescNonItem = createPicker("#pickr-desc-nonitem");

  /* ----------  Item vs non‑item form toggle ---------- */
  function updateItemFieldsVisibility() {
    const isItem = editType.value === "Item";
    itemExtraFields.style.display        = isItem ? "block" : "none";
    nonItemDescription.style.display     = isItem ? "none"  : "block";
    predefinedItemContainer.style.display= isItem ? "block" : "none";
    if (isItem) populatePredefinedItemsDropdown();
  }
  editType.addEventListener("change", updateItemFieldsVisibility);

  /* ----------  Predefined dropdown change ---------- */
  predefinedItemDropdown.addEventListener("change", () => {
    const id = predefinedItemDropdown.value;
    if (!id || !predefinedItemDefs[id]) return;
    const d = predefinedItemDefs[id];
    editName.value = d.name || "";          pickrName.setColor(d.nameColor || "#E5E6E8");
    editRarity.value = d.rarity || "";      pickrRarity.setColor(d.rarityColor || "#E5E6E8");
    editItemType.value = d.itemType || d.type || "";
    pickrItemType.setColor(d.itemTypeColor || "#E5E6E8");
    editDescription.value = d.description || "";
    pickrDescItem.setColor(d.descriptionColor || "#E5E6E8");
    extraLines = d.extraLines ? JSON.parse(JSON.stringify(d.extraLines)) : [];
    renderExtraLines();
    editImageSmall.value = d.imageSmall || "";
    editImageBig.value   = d.imageBig   || "";
  });

  /* ----------  Edit‑form helpers ---------- */
  let extraLines = [];
  function renderExtraLines() {
    extraLinesContainer.innerHTML = "";
    extraLines.forEach((line, idx) => {
      const row = document.createElement("div");
      row.className = "field-row"; row.style.marginBottom = "5px";
      const txt = document.createElement("input"); txt.type="text";
      txt.value = line.text; txt.style.background="#E5E6E8"; txt.style.color="#000";
      txt.addEventListener("input", ()=>{ extraLines[idx].text = txt.value; });
      const colorBox = document.createElement("div");
      colorBox.className="color-btn"; colorBox.style.marginLeft="5px";
      const xBtn = document.createElement("button"); xBtn.type="button"; xBtn.textContent="x";
      xBtn.style.marginLeft="5px"; xBtn.addEventListener("click",()=>{
        extraLines.splice(idx,1); renderExtraLines();
      });
      row.appendChild(txt); row.appendChild(colorBox); row.appendChild(xBtn);
      extraLinesContainer.appendChild(row);
      Pickr.create({
        el: colorBox, theme:"nano", default: line.color||"#E5E6E8",
        components:{ preview:true,opacity:true,hue:true,
          interaction:{hex:true,rgba:true,input:true,save:true} }
      })
      .on("change",c=>{ extraLines[idx].color=c.toHEXA().toString(); })
      .on("save",(_,p)=>p.hide())
      .setColor(line.color||"#E5E6E8");
    });
  }
  document.getElementById("add-extra-line")
          .addEventListener("click", ()=>{ extraLines.push({text:"",color:"#E5E6E8"}); renderExtraLines(); });
  document.getElementById("edit-cancel")
          .addEventListener("click", ()=>{ editModal.style.display="none"; currentEdit=null; extraLines=[]; });

  /* ----------  populateEditForm ---------- */
  function populateEditForm(m) {
    editName.value = m.name || ""; pickrName.setColor(m.nameColor||"#E5E6E8");
    editType.value = m.type || "Door";
    editImageSmall.value = m.imageSmall || "";
    editImageBig.value   = m.imageBig   || "";
    editVideoURL.value   = m.videoURL  || "";
    updateItemFieldsVisibility();
    if (m.type === "Item") {
      predefinedItemDropdown.value = m.predefinedItemId || "";
      editRarity.value = m.rarity ? m.rarity.toLowerCase() : "";
      pickrRarity.setColor(m.rarityColor || "#E5E6E8");
      editItemType.value = m.itemType || "Crafting Material";
      pickrItemType.setColor(m.itemTypeColor || "#E5E6E8");
      editDescription.value = m.description || "";
      pickrDescItem.setColor(m.descriptionColor || "#E5E6E8");
      extraLines = m.extraLines ? JSON.parse(JSON.stringify(m.extraLines)) : [];
      renderExtraLines();
    } else {
      nonItemDescription.value = m.description || "";
      pickrDescNonItem.setColor(m.descriptionColor || "#E5E6E8");
    }
  }

  /* ----------  Edit‑form submit ---------- */
  let currentEdit = null;
  editForm.addEventListener("submit", (e)=>{
    e.preventDefault(); if (!currentEdit) return;
    const d = currentEdit.data;
    d.name = editName.value;
    d.nameColor = pickrName.getColor()?.toHEXA()?.toString() || "#E5E6E8";
    d.type = editType.value;
    d.imageSmall = editImageSmall.value;
    d.imageBig   = editImageBig.value;
    d.videoURL   = editVideoURL.value || "";
    d.predefinedItemId = predefinedItemDropdown.value || null;
    if (d.type==="Item") {
      d.rarity = formatRarity(editRarity.value);
      d.rarityColor = pickrRarity.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      d.itemType = editItemType.value;
      d.itemTypeColor = pickrItemType.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      d.description = editDescription.value;
      d.descriptionColor = pickrDescItem.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      d.extraLines = JSON.parse(JSON.stringify(extraLines));
    } else {
      d.description = nonItemDescription.value;
      d.descriptionColor = pickrDescNonItem.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      delete d.rarity; delete d.rarityColor; delete d.itemType;
      delete d.itemTypeColor; delete d.extraLines;
    }
    currentEdit.markerObj.setPopupContent(createPopupContent(d));
    firebaseUpdateMarker(db,d);
    editModal.style.display="none"; extraLines=[]; currentEdit=null;
  });

  /* ----------  Dropdown population ---------- */
  async function populatePredefinedItemsDropdown() {
    const defs = await loadItemDefinitions(db);
    predefinedItemDefs = {}; predefinedItemDropdown.innerHTML='<option value="">-- Select an item --</option>';
    defs.forEach(d=>{
      predefinedItemDefs[d.id]=d;
      const opt=document.createElement("option"); opt.value=d.id; opt.textContent=d.name;
      predefinedItemDropdown.appendChild(opt);
    });
  }

  /* ----------  Marker helpers ---------- */
  function createMarkerWrapper(m, cbs) {
    const markerObj = createMarker(m,map,layers,showContextMenu,cbs);
    allMarkers.push({markerObj,data:m});
    return markerObj;
  }
  function addMarker(m,cbs={}) { return createMarkerWrapper(m,cbs); }

  function onEdit(markerObj,m,ev){
    currentEdit={markerObj,data:m}; populateEditForm(m);
    positionModal(editModal,ev); editModal.style.display="block"; }
  function onCopy(_,m){ copiedMarkerData={...m}; delete copiedMarkerData.id; pasteMode=true; }
  function onDragEnd(_,m){ firebaseUpdateMarker(db,m); }
  function onDelete(markerObj,m){
    layers[m.type].removeLayer(markerObj);
    const i=allMarkers.findIndex(o=>o.data.id===m.id);
    if(i!==-1) allMarkers.splice(i,1);
    if(m.id) firebaseDeleteMarker(db,m.id);
  }

  /* ----------  Initial marker load ---------- */
  (async ()=>{
    const markers=await loadMarkers(db);
    markers.forEach(m=>{
      if(!m.type||!layers[m.type])return;
      if(!m.coords)m.coords=[1500,1500];
      addMarker(m,{onEdit,onCopy,onDragEnd,onDelete});
    });
  })();

  /* ----------  Map context‑menu: Create Marker ---------- */
  map.on("contextmenu", (evt)=>{
    showContextMenu(evt.originalEvent.pageX,evt.originalEvent.pageY,[{
      text:"Create New Marker",
      action:()=>{
        currentEdit=null;
        editName.value=""; pickrName.setColor("#E5E6E8");
        editType.value="Item"; editImageSmall.value=""; editImageBig.value="";
        editVideoURL.value=""; editRarity.value=""; pickrRarity.setColor("#E5E6E8");
        editItemType.value="Crafting Material"; pickrItemType.setColor("#E5E6E8");
        editDescription.value=""; pickrDescItem.setColor("#E5E6E8");
        extraLines=[]; renderExtraLines(); updateItemFieldsVisibility();
        positionModal(editModal,evt.originalEvent); editModal.style.display="block";

        const originalSubmit = editForm.onsubmit;
        editForm.onsubmit = (e2)=>{
          e2.preventDefault();
          const nm={
            type:editType.value,
            name:editName.value||"New Marker",
            nameColor:pickrName.getColor()?.toHEXA()?.toString()||"#E5E6E8",
            coords:[evt.latlng.lat,evt.latlng.lng],
            imageSmall:editImageSmall.value,
            imageBig:editImageBig.value,
            videoURL:editVideoURL.value||"",
            predefinedItemId:predefinedItemDropdown.value||null
          };
          if(nm.type==="Item"){
            nm.rarity=formatRarity(editRarity.value);
            nm.rarityColor=pickrRarity.getColor()?.toHEXA()?.toString()||"#E5E6E8";
            nm.itemType=editItemType.value;
            nm.itemTypeColor=pickrItemType.getColor()?.toHEXA()?.toString()||"#E5E6E8";
            nm.description=editDescription.value;
            nm.descriptionColor=pickrDescItem.getColor()?.toHEXA()?.toString()||"#E5E6E8";
            nm.extraLines=JSON.parse(JSON.stringify(extraLines));
          } else {
            nm.description=nonItemDescription.value;
            nm.descriptionColor=pickrDescNonItem.getColor()?.toHEXA()?.toString()||"#E5E6E8";
          }
          addMarker(nm,{onEdit,onCopy,onDragEnd,onDelete});
          firebaseAddMarker(db,nm);
          editModal.style.display="none"; extraLines=[]; editForm.onsubmit=originalSubmit;
        };
      }
    }]);
  });

  /* ----------  Map click – Paste Marker ---------- */
  map.on("click",(evt)=>{
    if(!copiedMarkerData||!pasteMode)return;
    const nm=JSON.parse(JSON.stringify(copiedMarkerData));
    delete nm.id; nm.coords=[evt.latlng.lat,evt.latlng.lng]; nm.name+=" (copy)";
    addMarker(nm,{onEdit,onCopy,onDragEnd,onDelete});
    firebaseAddMarker(db,nm);
  });

});

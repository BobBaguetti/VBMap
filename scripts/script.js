// @keep:    Comments must NOT be deleted unless their associated code is also deleted;
//           edits to comments only when code changes.
// @file:    /scripts/script.js
// @version: 5.3

import { initializeMap } from "./modules/map/map.js";
import { showContextMenu } from "./modules/ui/uiManager.js";
import {
  initializeFirebase,
  loadMarkers,
  addMarker as firebaseAddMarker,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "./modules/services/firebaseService.js";
import { createMarker, renderPopup } from "./modules/map/markerManager.js";
import { initItemDefinitionsModal } from "./modules/ui/modals/itemDefinitionsModal.js";
import { initMarkerModal } from "./modules/ui/modals/markerModal.js";
import { initCopyPasteManager } from "./modules/map/copyPasteManager.js";
import { setupSidebar } from "./modules/sidebar/sidebarManager.js";
import { subscribeItemDefinitions } from "./modules/services/itemDefinitionsService.js";
import { initQuestDefinitionsModal } from "./modules/ui/modals/questDefinitionsModal.js";
import { activateFloatingScrollbars } from "./modules/utils/scrollUtils.js"; 

/* ------------------------------------------------------------------ *
 *  Firebase Initialization
 * ------------------------------------------------------------------ */
const db = initializeFirebase({
  apiKey: "AIzaSyDwEdPN5MB8YAuM_jb0K1iXfQ-tGQ",
  authDomain: "vbmap-cc834.firebaseapp.com",
  projectId: "vbmap-cc834",
  storageBucket: "vbmap-cc834.firebasestorage.app",
  messagingSenderId: "244112699360",
  appId: "1:244112699360:web:95f50adb6e10b438238585",
  measurementId: "G-7FDNWLRM95"
});

/* ------------------------------------------------------------------ *
 *  Map & Layers Setup
 * ------------------------------------------------------------------ */
const { map } = initializeMap();

// two item layers: one clustered, one flat
const clusterItemLayer = L.markerClusterGroup();
const flatItemLayer    = L.layerGroup();

const layers = {
  Door:               L.layerGroup(),
  "Extraction Portal":L.layerGroup(),
  Item:               clusterItemLayer,   // initial grouping = ON
  Teleport:           L.layerGroup(),
  "Spawn Point":      L.layerGroup()
};

// add all non-Item layers
Object.entries(layers).forEach(([k, grp]) => grp.addTo(map));
// also add flatItemLayer (but immediately remove so it’s ready)
flatItemLayer.addTo(map);
map.removeLayer(flatItemLayer);

/* ------------------------------------------------------------------ *
 *  Sidebar Setup
 * ------------------------------------------------------------------ */
const allMarkers = [];
let groupingOn = true;  // tracks which Item layer is active

const { filterMarkers, loadItemFilters } = await setupSidebar(
  map, layers, allMarkers, db,
  // pass us callbacks so sidebar can flip layers
  {
    enableGrouping: () => {
      if (!groupingOn) {
        map.removeLayer(flatItemLayer);
        map.addLayer(clusterItemLayer);
        layers.Item = clusterItemLayer;
        groupingOn = true;
      }
    },
    disableGrouping: () => {
      if (groupingOn) {
        map.removeLayer(clusterItemLayer);
        map.addLayer(flatItemLayer);
        layers.Item = flatItemLayer;
        groupingOn = false;
      }
    }
  }
);

/* ------------------------------------------------------------------ *
 *  Marker Modal
 * ------------------------------------------------------------------ */
const markerForm = initMarkerModal(db);

/* ------------------------------------------------------------------ *
 *  Definitions Modals
 * ------------------------------------------------------------------ */
const itemModal  = initItemDefinitionsModal(db);
const questModal = initQuestDefinitionsModal(db);

/* ------------------------------------------------------------------ *
 *  Subscriptions for Item Definition Changes
 * ------------------------------------------------------------------ */
subscribeItemDefinitions(db, async () => {
  await markerForm.refreshPredefinedItems();
  const { loadItemDefinitions } = await import("./modules/services/itemDefinitionsService.js");
  const list = await loadItemDefinitions(db);
  const defMap = Object.fromEntries(list.map(d => [d.id,d]));

  allMarkers.forEach(({ markerObj,data })=> {
    if (!data.predefinedItemId) return;
    const def = defMap[data.predefinedItemId];
    if (!def) return;
    Object.assign(data,{
      name:      def.name,
      nameColor: def.nameColor||"#E5E6E8",
      rarity:    def.rarity,
      rarityColor: def.rarityColor||"#E5E6E8",
      description: def.description,
      descriptionColor: def.descriptionColor||"#E5E6E8",
      extraLines: JSON.parse(JSON.stringify(def.extraLines||[])),
      imageSmall: def.imageSmall,
      imageBig:   def.imageBig,
      value:      def.value ?? null,
      quantity:   def.quantity ?? null
    });
    if (def.itemType) {
      data.itemType      = def.itemType;
      data.itemTypeColor = def.itemTypeColor||"#E5E6E8";
    }
    markerObj.setPopupContent(renderPopup(data));
    firebaseUpdateMarker(db,data);
  });

  await loadItemFilters();
  filterMarkers();
});

/* ------------------------------------------------------------------ *
 *  Add & Persist Marker
 * ------------------------------------------------------------------ */
function addAndPersist(data) {
  const markerObj = addMarker(data, callbacks);
  firebaseAddMarker(db,data);
  return markerObj;
}

/* ------------------------------------------------------------------ *
 *  Copy-Paste Manager
 * ------------------------------------------------------------------ */
const copyMgr = initCopyPasteManager(map, addAndPersist);

/* ------------------------------------------------------------------ *
 *  Marker Management Helpers
 * ------------------------------------------------------------------ */
function addMarker(data, cbs = {}) {
  const markerObj = createMarker(data,map,layers,showContextMenu,cbs);
  // add into whichever layer is current
  if (groupingOn) clusterItemLayer.addLayer(markerObj);
  else            flatItemLayer.addLayer(markerObj);

  allMarkers.push({markerObj,data});
  return markerObj;
}

const callbacks = {
  onEdit:   (m,d,ev) => markerForm.openEdit(m,d,ev,upd=>{
                m.setPopupContent(renderPopup(upd));
                firebaseUpdateMarker(db,upd);
              }),
  onCopy:   (_,d)   => copyMgr.startCopy(d),
  onDragEnd:(_,d)   => firebaseUpdateMarker(db,d),
  onDelete:(m,d)    => {
    layers[d.type].removeLayer(m);
    const idx = allMarkers.findIndex(o=>o.data.id===d.id);
    if (idx!==-1) allMarkers.splice(idx,1);
    if (d.id) firebaseDeleteMarker(db,d.id);
  }
};

/* ------------------------------------------------------------------ *
 *  Load Markers from Firestore
 * ------------------------------------------------------------------ */
(async()=>{
  const markers = await loadMarkers(db);
  markers.forEach(m=>{
    if (!m.type||!layers[m.type]) return;
    if (!m.coords) m.coords=[1500,1500];
    addMarker(m,callbacks);
  });
  filterMarkers();
})();

/* ------------------------------------------------------------------ *
 *  Create New on Right-click
 * ------------------------------------------------------------------ */
map.on("contextmenu",evt=>{
  showContextMenu(evt.originalEvent.pageX,evt.originalEvent.pageY,[{
    text:"Create New Marker",
    action:()=> markerForm.openCreate(
      [evt.latlng.lat,evt.latlng.lng],
      "Item",
      evt.originalEvent,
      newData=>addAndPersist(newData)
    )
  }]);
});

// Hide context menu on outside click
document.addEventListener("click",e=>{
  const cm = document.getElementById("context-menu");
  if (cm && cm.style.display==="block" && !cm.contains(e.target)) {
    cm.style.display="none";
  }
});

/* ------------------------------------------------------------------ *
 *  Floating Scrollbars
 * ------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded",activateFloatingScrollbars);

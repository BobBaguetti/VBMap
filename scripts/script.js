// scripts/script.js
import { initializeMap } from "./modules/map.js";
import {
  showContextMenu,
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
import { initItemDefinitionsModal } from "./modules/itemDefinitionsModal.js";
import { initMarkerForm } from "./modules/markerForm.js";
import { setupSidebar } from "./modules/sidebarManager.js";

/* ------------------------------------------------------------------ *
 *  Firebase
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
 *  Map & layers
 * ------------------------------------------------------------------ */
const { map } = initializeMap();
const itemLayer = L.markerClusterGroup();
const layers = {
  "Door":              L.layerGroup(),
  "Extraction Portal": L.layerGroup(),
  "Item":              itemLayer,
  "Teleport":          L.layerGroup()
};
Object.values(layers).forEach(l => l.addTo(map));

/* ------------------------------------------------------------------ *
 *  Sidebar
 * ------------------------------------------------------------------ */
const allMarkers = [];
setupSidebar(map, layers, allMarkers);

/* ------------------------------------------------------------------ *
 *  Marker‑form module
 * ------------------------------------------------------------------ */
const markerForm = initMarkerForm(db);

/* ------------------------------------------------------------------ *
 *  Item‑definitions modal (refreshes dropdown inside markerForm)
 * ------------------------------------------------------------------ */
initItemDefinitionsModal(db, markerForm.refreshPredefinedItems);

/* ------------------------------------------------------------------ *
 *  Copy / paste clipboard
 * ------------------------------------------------------------------ */
let copiedMarkerData = null;
let pasteMode        = false;
attachContextMenuHider();
attachRightClickCancel(() => { pasteMode = false; copiedMarkerData = null; });

/* ------------------------------------------------------------------ *
 *  Helpers: addMarker & callbacks
 * ------------------------------------------------------------------ */
function createMarkerWrapper(data, cbs) {
  const markerObj = createMarker(data, map, layers, showContextMenu, cbs);
  allMarkers.push({ markerObj, data });
  return markerObj;
}
function addMarker(data, cbs = {}) {
  return createMarkerWrapper(data, cbs);
}

/* ----- Callbacks passed to markerManager ----- */
function handleEdit(markerObj, data, evt) {           // <-- FIX HERE
  markerForm.openEdit(markerObj, data, evt, (updated)=>{
    markerObj.setPopupContent(createPopupContent(updated));
    firebaseUpdateMarker(db, updated);
  });
}
function handleCopy(_, data) {
  copiedMarkerData = { ...data }; delete copiedMarkerData.id; pasteMode = true;
}
function handleDragEnd(_, data) { firebaseUpdateMarker(db, data); }
function handleDelete(markerObj, data) {
  layers[data.type].removeLayer(markerObj);
  const idx = allMarkers.findIndex(o => o.data.id === data.id);
  if (idx !== -1) allMarkers.splice(idx, 1);
  if (data.id) firebaseDeleteMarker(db, data.id);
}

/* ------------------------------------------------------------------ *
 *  Initial marker load
 * ------------------------------------------------------------------ */
(async () => {
  const markers = await loadMarkers(db);
  markers.forEach(m => {
    if (!m.type || !layers[m.type]) return;
    if (!m.coords) m.coords = [1500, 1500];
    addMarker(m, { onEdit: handleEdit, onCopy: handleCopy,
                   onDragEnd: handleDragEnd, onDelete: handleDelete });
  });
})();

/* ------------------------------------------------------------------ *
 *  Map context‑menu: Create marker
 * ------------------------------------------------------------------ */
map.on("contextmenu", (evt) => {
  showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [{
    text: "Create New Marker",
    action: () => {
      markerForm.openCreate(
        [evt.latlng.lat, evt.latlng.lng],
        "Item",
        evt.originalEvent,
        (newData) => {
          addMarker(newData, { onEdit: handleEdit, onCopy: handleCopy,
                               onDragEnd: handleDragEnd, onDelete: handleDelete });
          firebaseAddMarker(db, newData);
        }
      );
    }
  }]);
});

/* ------------------------------------------------------------------ *
 *  Map click: paste duplicate
 * ------------------------------------------------------------------ */
map.on("click", (evt)=>{
  if (!copiedMarkerData || !pasteMode) return;
  const d = JSON.parse(JSON.stringify(copiedMarkerData));
  delete d.id;
  d.coords = [evt.latlng.lat, evt.latlng.lng];
  d.name  += " (copy)";
  addMarker(d, { onEdit: handleEdit, onCopy: handleCopy,
                 onDragEnd: handleDragEnd, onDelete: handleDelete });
  firebaseAddMarker(db, d);
});

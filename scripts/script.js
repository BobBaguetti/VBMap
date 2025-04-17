// scripts/script.js
import { initializeMap } from "./modules/map.js";
import { showContextMenu } from "./modules/uiManager.js";
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
import { initCopyPasteManager } from "./modules/copyPasteManager.js";
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
  Door:               L.layerGroup(),
  "Extraction Portal":L.layerGroup(),
  Item:               itemLayer,
  Teleport:           L.layerGroup()
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
 *  Item‑definitions modal
 * ------------------------------------------------------------------ */
initItemDefinitionsModal(db, markerForm.refreshPredefinedItems);

/* ------------------------------------------------------------------ *
 *  Helper: add marker and save to Firestore
 * ------------------------------------------------------------------ */
function addAndPersist(data) {
  addMarker(data, callbacks);
  firebaseAddMarker(db, data);
}

/* ------------------------------------------------------------------ *
 *  Copy‑paste manager  (ghost preview + click‑to‑paste)
 * ------------------------------------------------------------------ */
const copyMgr = initCopyPasteManager(map, addAndPersist);

/* ------------------------------------------------------------------ *
 *  Marker creation helpers
 * ------------------------------------------------------------------ */
function addMarker(data, cbs = {}) {
  const markerObj =
    createMarker(data, map, layers, showContextMenu, cbs);
  allMarkers.push({ markerObj, data });
  return markerObj;
}

const callbacks = {
  onEdit:   (markerObj, data, ev) => {
    markerForm.openEdit(markerObj, data, ev, updated => {
      markerObj.setPopupContent(createPopupContent(updated));
      firebaseUpdateMarker(db, updated);
    });
  },
  onCopy:   (_, data) => copyMgr.startCopy(data),
  onDragEnd: (_, data) => firebaseUpdateMarker(db, data),
  onDelete: (markerObj, data) => {
    layers[data.type].removeLayer(markerObj);
    const idx = allMarkers.findIndex(o => o.data.id === data.id);
    if (idx !== -1) allMarkers.splice(idx, 1);
    if (data.id) firebaseDeleteMarker(db, data.id);
  }
};

/* ------------------------------------------------------------------ *
 *  Initial marker load
 * ------------------------------------------------------------------ */
(async () => {
  const markers = await loadMarkers(db);
  markers.forEach(m => {
    if (!m.type || !layers[m.type]) return;
    if (!m.coords) m.coords = [1500, 1500];
    addMarker(m, callbacks);
  });
})();

/* ------------------------------------------------------------------ *
 *  Map context‑menu: Create marker
 * ------------------------------------------------------------------ */
map.on("contextmenu", evt => {
  showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [{
    text: "Create New Marker",
    action: () => {
      markerForm.openCreate(
        [evt.latlng.lat, evt.latlng.lng],
        "Item",
        evt.originalEvent,
        newData => addAndPersist(newData)
      );
    }
  }]);
});

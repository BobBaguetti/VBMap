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
const itemLayer = L.markerClusterGroup();
const layers = {
  Door:               L.layerGroup(),
  "Extraction Portal":L.layerGroup(),
  Item:               itemLayer,
  Teleport:           L.layerGroup(),
  "Spawn Point":      L.layerGroup()
};
Object.values(layers).forEach(layerGroup => layerGroup.addTo(map));

/* ------------------------------------------------------------------ *
 *  Sidebar Setup (await the promise to get API)
 * ------------------------------------------------------------------ */
const allMarkers = [];
const { filterMarkers, loadItemFilters } = await setupSidebar(map, layers, allMarkers, db);

/* ------------------------------------------------------------------ *
 *  Marker Form Module Initialization
 * ------------------------------------------------------------------ */
const markerForm = initMarkerForm(db);

/* ------------------------------------------------------------------ *
 *  Helper: Refresh Markers When Definitions Change
 * ------------------------------------------------------------------ */
async function refreshMarkersFromDefinitions() {
  const { loadItemDefinitions } = await import("./modules/itemDefinitionsService.js");
  const defsList = await loadItemDefinitions(db);
  const defMap = Object.fromEntries(defsList.map(d => [d.id, d]));

  allMarkers.forEach(({ markerObj, data }) => {
    if (!data.predefinedItemId) return;
    const def = defMap[data.predefinedItemId];
    if (!def) return;

    Object.assign(data, {
      name:             def.name,
      nameColor:        def.nameColor       || "#E5E6E8",
      rarity:           def.rarity,
      rarityColor:      def.rarityColor     || "#E5E6E8",
      itemType:         def.itemType || def.type,
      itemTypeColor:    def.itemTypeColor   || "#E5E6E8",
      description:      def.description,
      descriptionColor: def.descriptionColor|| "#E5E6E8",
      extraLines:       JSON.parse(JSON.stringify(def.extraLines || [])),
      imageSmall:       def.imageSmall,
      imageBig:         def.imageBig
    });

    markerObj.setPopupContent(createPopupContent(data));
    firebaseUpdateMarker(db, data);
  });
}

/* ------------------------------------------------------------------ *
 *  Item Definitions Modal Initialization
 *  -> reload sidebar item filters after any change
 * ------------------------------------------------------------------ */
initItemDefinitionsModal(db, async () => {
  await markerForm.refreshPredefinedItems();
  await refreshMarkersFromDefinitions();
  await loadItemFilters();   // now defined
  filterMarkers();           // now defined
});

/* ------------------------------------------------------------------ *
 *  Add & Persist Helper
 * ------------------------------------------------------------------ */
function addAndPersist(data) {
  const markerObj = addMarker(data, callbacks);
  firebaseAddMarker(db, data);
  return markerObj;
}

/* ------------------------------------------------------------------ *
 *  Copy‑Paste Manager Initialization
 * ------------------------------------------------------------------ */
const copyMgr = initCopyPasteManager(map, addAndPersist);

/* ------------------------------------------------------------------ *
 *  Marker Creation & Callbacks
 * ------------------------------------------------------------------ */
function addMarker(data, cbs = {}) {
  const markerObj = createMarker(data, map, layers, showContextMenu, cbs);
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
 *  Initial Marker Load from Firestore
 * ------------------------------------------------------------------ */
(async () => {
  const markers = await loadMarkers(db);
  markers.forEach(m => {
    if (!m.type || !layers[m.type]) return;
    if (!m.coords) m.coords = [1500, 1500];
    addMarker(m, callbacks);
  });
  filterMarkers();
})();

/* ------------------------------------------------------------------ *
 *  Map Context‑Menu for Creating New Markers
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
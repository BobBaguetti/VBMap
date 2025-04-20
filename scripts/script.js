// @fullfile: Send the entire file, no omissions or abridgments.
// @version: 3   The current file version is 3. Increase by 1 every time you update anything.
// @file:    /scripts/script.js

import { initializeMap } from "./modules/map/map.js";
import { showContextMenu } from "./modules/ui/uiManager.js";
import {
  initializeFirebase,
  loadMarkers,
  addMarker as firebaseAddMarker,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "./modules/services/firebaseService.js";
import { createMarker, createPopupContent } from "./modules/map/markerManager.js";
import { initItemDefinitionsModal } from "./modules/ui/modals/itemDefinitionsModal.js";
import { initMarkerModal } from "./modules/ui/modals/markerModal.js";
import { initCopyPasteManager } from "./modules/map/copyPasteManager.js";
import { setupSidebar } from "./modules/sidebar/sidebarManager.js";
import { subscribeItemDefinitions } from "./modules/services/itemDefinitionsService.js";
import { initQuestDefinitionsModal } from "./modules/ui/modals/questDefinitionsModal.js";

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
 *  Sidebar Setup
 * ------------------------------------------------------------------ */
const allMarkers = [];
const { filterMarkers, loadItemFilters } = await setupSidebar(map, layers, allMarkers, db);

/* ------------------------------------------------------------------ *
 *  Marker Modal
 * ------------------------------------------------------------------ */
const markerForm = initMarkerModal(db);

/* ------------------------------------------------------------------ *
 *  Modals
 * ------------------------------------------------------------------ */
const itemModal = initItemDefinitionsModal(db);
document.getElementById("manage-item-definitions").addEventListener("click", () => itemModal.open());

const questModal = initQuestDefinitionsModal(db);
document.getElementById("manage-quest-definitions").addEventListener("click", () => questModal.open());

/* ------------------------------------------------------------------ *
 *  Subscriptions for Item Definition Changes
 * ------------------------------------------------------------------ */
subscribeItemDefinitions(db, async () => {
  await markerForm.refreshPredefinedItems();

  const { loadItemDefinitions } = await import("./modules/services/itemDefinitionsService.js");
  const defsList = await loadItemDefinitions(db);
  const defMap = Object.fromEntries(defsList.map(d => [d.id, d]));

  allMarkers.forEach(({ markerObj, data }) => {
    if (!data.predefinedItemId) return;
    const def = defMap[data.predefinedItemId];
    if (!def) return;

    Object.assign(data, {
      name:             def.name,
      nameColor:        def.nameColor    || "#E5E6E8",
      rarity:           def.rarity,
      rarityColor:      def.rarityColor  || "#E5E6E8",
      description:      def.description,
      descriptionColor: def.descriptionColor || "#E5E6E8",
      extraLines:       JSON.parse(JSON.stringify(def.extraLines || [])),
      imageSmall:       def.imageSmall,
      imageBig:         def.imageBig,
      value:            def.value ?? null,
      quantity:         def.quantity ?? null
    });

    // Add only if itemType is defined
    if (def.itemType) {
      data.itemType = def.itemType;
      data.itemTypeColor = def.itemTypeColor || "#E5E6E8";
    } else {
      delete data.itemType;
      delete data.itemTypeColor;
    }

    markerObj.setPopupContent(createPopupContent(data));
    firebaseUpdateMarker(db, data);
  });

  await loadItemFilters();
  filterMarkers();
});

/* ------------------------------------------------------------------ *
 *  Add & Persist Marker
 * ------------------------------------------------------------------ */
function addAndPersist(data) {
  const markerObj = addMarker(data, callbacks);
  firebaseAddMarker(db, data);
  return markerObj;
}

/* ------------------------------------------------------------------ *
 *  Copy‑Paste Manager
 * ------------------------------------------------------------------ */
const copyMgr = initCopyPasteManager(map, addAndPersist);

/* ------------------------------------------------------------------ *
 *  Marker Management
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
 *  Load Markers from Firestore
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

// Hide context menu on click outside
document.addEventListener("click", e => {
  const contextMenu = document.getElementById("context-menu");
  if (contextMenu && contextMenu.style.display === "block") {
    if (!contextMenu.contains(e.target)) {
      contextMenu.style.display = "none";
    }
  }
});

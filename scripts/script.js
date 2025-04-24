// @keep:    Comments must NOT be deleted unless their associated code is also deleted;
//           edits to comments only when code changes.
// @file:    /scripts/script.js
// @version: 5.6

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

// world layers, initially point Item to flat (grouping OFF)
const layers = {
  Door:               L.layerGroup(),
  "Extraction Portal":L.layerGroup(),
  Item:               flatItemLayer,
  Teleport:           L.layerGroup(),
  "Spawn Point":      L.layerGroup()
};

// add all non-Item layers
Object.entries(layers).forEach(([key, layer]) => {
  if (key !== "Item") layer.addTo(map);
});
// show flat layer by default
flatItemLayer.addTo(map);

let groupingOn = false;

/* ------------------------------------------------------------------ *
 *  Sidebar Setup
 * ------------------------------------------------------------------ */
const allMarkers = [];

// callbacks for sidebar to flip grouping
const groupingCallbacks = {
  enableGrouping: () => {
    // move from flat → cluster
    flatItemLayer.eachLayer(m => {
      flatItemLayer.removeLayer(m);
      clusterItemLayer.addLayer(m);
    });
    map.removeLayer(flatItemLayer);
    map.addLayer(clusterItemLayer);
    layers.Item = clusterItemLayer;
    groupingOn = true;
  },
  disableGrouping: () => {
    // move from cluster → flat
    clusterItemLayer.eachLayer(m => {
      clusterItemLayer.removeLayer(m);
      flatItemLayer.addLayer(m);
    });
    map.removeLayer(clusterItemLayer);
    map.addLayer(flatItemLayer);
    layers.Item = flatItemLayer;
    groupingOn = false;
  }
};

const { filterMarkers, loadItemFilters } = await setupSidebar(
  map, layers, allMarkers, db,
  groupingCallbacks
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

    if (def.itemType) {
      data.itemType = def.itemType;
      data.itemTypeColor = def.itemTypeColor || "#E5E6E8";
    }

    markerObj.setPopupContent(renderPopup(data));
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
 *  Copy-Paste Manager
 * ------------------------------------------------------------------ */
const copyMgr = initCopyPasteManager(map, addAndPersist);

/* ------------------------------------------------------------------ *
 *  Marker Management
 * ------------------------------------------------------------------ */
function addMarker(data, cbs = {}) {
  const markerObj = createMarker(data, map, layers, showContextMenu, cbs);
  if (groupingOn) clusterItemLayer.addLayer(markerObj);
  else            flatItemLayer.addLayer(markerObj);
  allMarkers.push({ markerObj, data });
  return markerObj;
}

const callbacks = {
  onEdit:   (markerObj, data, ev) => {
    markerForm.openEdit(markerObj, data, ev, updated => {
      markerObj.setPopupContent(renderPopup(updated));
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
 *  Map Context-Menu for Creating New Markers
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
  const cm = document.getElementById("context-menu");
  if (cm && cm.style.display === "block" && !cm.contains(e.target)) {
    cm.style.display = "none";
  }
});

/* ------------------------------------------------------------------ *
 *  Floating Scrollbar Activation
 * ------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  activateFloatingScrollbars();
});

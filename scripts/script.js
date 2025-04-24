// @keep: Comments must NOT be deleted unless code is deleted.
// @file: scripts/script.js
// @version: 6

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
const db = initializeFirebase({ /* … */ });

/* ------------------------------------------------------------------ *
 *  Map & Layers Setup
 * ------------------------------------------------------------------ */
const { map } = initializeMap();
const itemLayer   = L.markerClusterGroup();
const nonCluster  = L.layerGroup();           // for un-clustered markers
const layers = {
  Door:                L.layerGroup(),
  "Extraction Portal": L.layerGroup(),
  Item:                itemLayer,
  Teleport:            L.layerGroup(),
  "Spawn Point":       L.layerGroup()
};
Object.values(layers).forEach(g => g.addTo(map));

/* ------------------------------------------------------------------ *
 *  Sidebar Setup
 * ------------------------------------------------------------------ */
const allMarkers = [];
const { filterMarkers, loadItemFilters, loadEnemyFilters } =
  await setupSidebar(map, layers, allMarkers, db);

/* ------------------------------------------------------------------ *
 *  Marker Modal
 * ------------------------------------------------------------------ */
const markerForm = initMarkerModal(db);

/* ------------------------------------------------------------------ *
 *  Modals (old + test + quest)
 * ------------------------------------------------------------------ */
const itemModal  = initItemDefinitionsModal(db);
document.getElementById("manage-item-definitions")
        .addEventListener("click", () => itemModal.open());
const questModal = initQuestDefinitionsModal(db);
document.getElementById("manage-quest-definitions")
        .addEventListener("click", () => questModal.open());

/* ------------------------------------------------------------------ *
 *  Subscriptions for Item Definition Changes
 * ------------------------------------------------------------------ */
subscribeItemDefinitions(db, async () => {
  await markerForm.refreshPredefinedItems();
  const { loadItemDefinitions } = await import("./modules/services/itemDefinitionsService.js");
  const defsList = await loadItemDefinitions(db);
  const defMap   = Object.fromEntries(defsList.map(d=>[d.id,d]));

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
      extraLines:       JSON.parse(JSON.stringify(def.extraLines||[])),
      imageSmall:       def.imageSmall,
      imageBig:         def.imageBig,
      value:            def.value ?? null,
      quantity:         def.quantity ?? null
    });
    if (def.itemType) {
      data.itemType      = def.itemType;
      data.itemTypeColor = def.itemTypeColor || "#E5E6E8";
    }
    markerObj.setPopupContent(renderPopup(data));
    firebaseUpdateMarker(db, data);
  });

  await loadItemFilters();
  await loadEnemyFilters();
  filterMarkers();
});

/* ------------------------------------------------------------------ *
 *  Copy-Paste Manager
 * ------------------------------------------------------------------ */
function addAndPersist(data) {
  const markerObj = addMarker(data, callbacks);
  firebaseAddMarker(db, data);
  return markerObj;
}
const copyMgr = initCopyPasteManager(map, addAndPersist);

/* ------------------------------------------------------------------ *
 *  Marker Management Helpers
 * ------------------------------------------------------------------ */
function addMarker(data, cbs = {}) {
  const markerObj = createMarker(data, map, layers, showContextMenu, cbs);
  allMarkers.push({ markerObj, data });
  return markerObj;
}
const callbacks = {
  onEdit:   (markerObj,data,ev) => {
    markerForm.openEdit(markerObj,data,ev,updated => {
      markerObj.setPopupContent(renderPopup(updated));
      firebaseUpdateMarker(db, updated);
    });
  },
  onCopy:   (_,data) => copyMgr.startCopy(data),
  onDragEnd:(_,data) => firebaseUpdateMarker(db, data),
  onDelete: (markerObj,data) => {
    layers[data.type].removeLayer(markerObj);
    const idx = allMarkers.findIndex(o => o.data.id===data.id);
    if (idx!==-1) allMarkers.splice(idx,1);
    if (data.id) firebaseDeleteMarker(db, data.id);
  }
};

/* ------------------------------------------------------------------ *
 *  Load all Markers from Firestore
 * ------------------------------------------------------------------ */
(async()=>{
  const markers = await loadMarkers(db);
  markers.forEach(m=>{
    if (!m.type||!layers[m.type]) return;
    if (!m.coords) m.coords=[1500,1500];
    addMarker(m, callbacks);
  });
  filterMarkers();
})();

/* ------------------------------------------------------------------ *
 *  Context-menu “Create New Marker”
 * ------------------------------------------------------------------ */
map.on("contextmenu", evt => {
  showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [{
    text: "Create New Marker",
    action: () => markerForm.openCreate(
      [evt.latlng.lat,evt.latlng.lng],
      "Item", evt.originalEvent,
      newData => addAndPersist(newData)
    )
  }]);
});
document.addEventListener("click", e => {
  const cm = document.getElementById("context-menu");
  if (cm?.style.display==="block" && !cm.contains(e.target)) {
    cm.style.display="none";
  }
});

/* ------------------------------------------------------------------ *
 *  Sidebar toggles: grouping & small-markers
 * ------------------------------------------------------------------ */
document.getElementById("enable-grouping").checked = false;
document.getElementById("enable-grouping")
  .addEventListener("change", e => {
    const on = e.target.checked;
    if (on) {
      map.removeLayer(nonCluster);
      layers.Item.addTo(map);
    } else {
      map.removeLayer(layers.Item);
      nonCluster.clearLayers();
      allMarkers.forEach(({markerObj}) => nonCluster.addLayer(markerObj));
      nonCluster.addTo(map);
    }
    filterMarkers();
  });

document.getElementById("toggle-small-markers")
  .addEventListener("change", e => {
    document.getElementById("map")
      .classList.toggle("small-markers", e.target.checked);
  });

/* ------------------------------------------------------------------ *
 *  Activate floating scrollbars in modals on DOM ready
 * ------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", activateFloatingScrollbars);

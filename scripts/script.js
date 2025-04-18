// @fullfile: Send the entire file, no omissions or abridgments.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted.
// @version: 2
// @file:    /scripts/script.js

import { initializeMap } from "./modules/map.js";
import { showContextMenu }    from "./modules/uiManager.js";
import {
  initializeFirebase,
  loadMarkers,
  addMarker    as firebaseAddMarker,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "./modules/firebaseService.js";
import { createMarker, createPopupContent } from "./modules/markerManager.js";
import { initItemDefinitionsModal } from "./modules/itemDefinitionsModal.js";
import { initMarkerForm            } from "./modules/markerForm.js";
import { initCopyPasteManager      } from "./modules/copyPasteManager.js";
import { setupSidebar              } from "./modules/sidebarManager.js";

// 1. Firebase & Map
const db = initializeFirebase({ /* your config */ });
const { map } = initializeMap();

// 2. Prepare layers & add to map
const itemLayer = L.markerClusterGroup();
export const layers = {
  Door:               L.layerGroup(),
  "Extraction Portal":L.layerGroup(),
  Item:               itemLayer,
  Teleport:           L.layerGroup(),
  "Spawn Point":      L.layerGroup()
};
Object.values(layers).forEach(lg => lg.addTo(map));

// 3. Sidebar must be set up before any markers are added
const allMarkers = [];
const { filterMarkers, loadItemFilters } = await setupSidebar(map, layers, allMarkers, db);

// 4. Init forms & modals
const markerForm = initMarkerForm(db);
initItemDefinitionsModal(db, async () => {
  await markerForm.refreshPredefinedItems();
  await loadItemFilters();
  filterMarkers();
});

// 5. Copy/Paste manager
const copyMgr = initCopyPasteManager(map, data => {
  const m = createAndPersist(data);
  return m;
});

// Helper to add & persist
function createAndPersist(data) {
  const markerObj = createMarker(data, map, layers, showContextMenu, callbacks);
  firebaseAddMarker(db, data);
  allMarkers.push({ markerObj, data });
  return markerObj;
}

// 6. Callbacks for markerManager
const callbacks = {
  onEdit:   (markerObj,data,ev) => {
    markerForm.openEdit(markerObj,data,ev, updated => {
      markerObj.setPopupContent(createPopupContent(updated));
      firebaseUpdateMarker(db, updated);
    });
  },
  onCopy:   (_, data) => copyMgr.startCopy(data),
  onDragEnd:(_, data) => firebaseUpdateMarker(db,data),
  onDelete:(markerObj,data) => {
    layers[data.type].removeLayer(markerObj);
    const idx = allMarkers.findIndex(x=>x.data.id===data.id);
    if(idx!==-1) allMarkers.splice(idx,1);
    if(data.id) firebaseDeleteMarker(db,data.id);
  }
};

// 7. Load existing markers
(async()=>{
  const list = await loadMarkers(db);
  list.forEach(m => {
    if(!m.type||!layers[m.type]) return;
    if(!m.coords) m.coords=[1500,1500];
    createMarker(m, map, layers, showContextMenu, callbacks);
    allMarkers.push({ markerObj: null, data: m });
  });
  filterMarkers();
})();

// 8. Map context‐menu for “Create New Marker”
map.on("contextmenu", evt => {
  showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [{
    text: "Create New Marker",
    action: () => {
      markerForm.openCreate(
        [evt.latlng.lat, evt.latlng.lng],
        "Item",
        evt.originalEvent,
        newData => createAndPersist(newData)
      );
    }
  }]);
});

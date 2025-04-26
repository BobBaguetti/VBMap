// @file: /scripts/script.js
// @version: 5.20

import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  getIdTokenResult
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { firebaseConfig } from "../src/firebaseConfig.js";

import { initializeMap }    from "./modules/map/map.js";
import { showContextMenu }  from "./modules/ui/uiManager.js";

import {
  loadMarkers,
  addMarker    as firebaseAddMarker,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "./modules/services/firebaseService.js";

import { createMarker, renderPopup }            from "./modules/map/markerManager.js";
import { initItemDefinitionsModal }             from "./modules/ui/modals/itemDefinitionsModal.js";
import { initMarkerModal }                      from "./modules/ui/modals/markerModal.js";
import { initCopyPasteManager }                 from "./modules/map/copyPasteManager.js";
import { setupSidebar }                         from "./modules/sidebar/sidebarManager.js";
import { subscribeItemDefinitions }             from "./modules/services/itemDefinitionsService.js";
import { initQuestDefinitionsModal }            from "./modules/ui/modals/questDefinitionsModal.js";
import { activateFloatingScrollbars }           from "./modules/utils/scrollUtils.js";

import { initAdminAuth } from "./authSetup.js";


/* ------------------------------------------------------------------ *
 *  Firebase & Map Setup
 * ------------------------------------------------------------------ */
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const { map } = initializeMap();

const clusterItemLayer = L.markerClusterGroup();
const flatItemLayer    = L.layerGroup();

const layers = {
  Door:               L.layerGroup(),
  "Extraction Portal":L.layerGroup(),
  Item:               flatItemLayer,
  Teleport:           L.layerGroup(),
  "Spawn Point":      L.layerGroup()
};

Object.entries(layers).forEach(([type, layer]) => {
  if (type !== "Item") layer.addTo(map);
});
flatItemLayer.addTo(map);

let groupingOn = false;


/* ------------------------------------------------------------------ *
 *  Admin Auth → Sidebar → Initial Marker Load
 * ------------------------------------------------------------------ */
initAdminAuth();

const allMarkers = [];
const groupingCallbacks = {
  enableGrouping: () => {
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

let filterMarkers, loadItemFilters;
let initialized = false;

onAuthStateChanged(auth, async user => {
  const claims  = user ? (await getIdTokenResult(user)).claims : {};
  const isAdmin = Boolean(claims.admin);
  document.body.classList.toggle("is-admin", isAdmin);

  if (!initialized) {
    // Setup sidebar now that .is-admin is set
    ({ filterMarkers, loadItemFilters } = await setupSidebar(
      map, layers, allMarkers, db, groupingCallbacks
    ));

    // Load existing markers
    const markers = await loadMarkers(db);
    markers.forEach(m => {
      if (!m.type || !layers[m.type]) return;
      if (!m.coords) m.coords = [1500, 1500];
      addMarker(m, callbacks);
    });

    await loadItemFilters();
    filterMarkers();
    initialized = true;
  } else {
    // On subsequent auth-changes, just re-filter
    await loadItemFilters();
    filterMarkers();
  }
});


/* ------------------------------------------------------------------ *
 *  Marker & Definition Modals
 * ------------------------------------------------------------------ */
const markerForm = initMarkerModal(db);
const itemModal  = initItemDefinitionsModal(db);
const questModal = initQuestDefinitionsModal(db);

subscribeItemDefinitions(db, async () => {
  await markerForm.refreshPredefinedItems();
  const { loadItemDefinitions } = await import(
    "./modules/services/itemDefinitionsService.js"
  );
  const defsList = await loadItemDefinitions(db);
  const defMap   = Object.fromEntries(defsList.map(d => [d.id, d]));

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

    markerObj.setPopupContent(renderPopup(data));

    // Use body class instead of undefined `isAdmin`
    if (document.body.classList.contains("is-admin")) {
      firebaseUpdateMarker(db, data)
        .then(() => console.log("🔄 Propagated def to marker:", data.id, data))
        .catch(err => {
          if (err.code !== "permission-denied") console.error(err);
        });
    }
  });

  await loadItemFilters();
  filterMarkers();
});


/* ------------------------------------------------------------------ *
 *  Add & Persist Marker
 * ------------------------------------------------------------------ */
async function addAndPersist(data) {
  const markerObj = addMarker(data, callbacks);
  const saved     = await firebaseAddMarker(db, data);
  console.log("✅ Marker created in Firestore:", saved.id, data);
  data.id         = saved.id;
  return markerObj;
}


/* ------------------------------------------------------------------ *
 *  Copy-Paste & Marker Management
 * ------------------------------------------------------------------ */
const copyMgr = initCopyPasteManager(map, addAndPersist);

function addMarker(data, cbs = {}) {
  const isAdmin = document.body.classList.contains("is-admin");
  const markerObj = createMarker(
    data, map, layers, showContextMenu, cbs, isAdmin
  );
  if (groupingOn) clusterItemLayer.addLayer(markerObj);
  else            flatItemLayer.addLayer(markerObj);
  allMarkers.push({ markerObj, data });
  return markerObj;
}

const callbacks = {
  onEdit:   (markerObj, data, ev) => {
    markerForm.openEdit(markerObj, data, ev, updated => {
      markerObj.setPopupContent(renderPopup(updated));
      firebaseUpdateMarker(db, updated)
        .then(() => console.log("✏️ Marker updated:", updated.id, updated))
        .catch(err => console.error("❌ Update failed:", err));
    });
  },
  onCopy:   (_, data) => copyMgr.startCopy(data),
  onDragEnd:(_, data) => {
    firebaseUpdateMarker(db, data)
      .then(() => console.log("🚚 Marker moved:", data.id, data.coords))
      .catch(err => console.error("❌ Move failed:", err));
  },
  onDelete:(markerObj, data) => {
    layers[data.type].removeLayer(markerObj);
    const idx = allMarkers.findIndex(o => o.data.id === data.id);
    if (idx !== -1) allMarkers.splice(idx, 1);
    if (data.id) {
      firebaseDeleteMarker(db, data.id)
        .then(() => console.log("🗑️ Marker deleted:", data.id))
        .catch(err => console.error("❌ Delete failed:", err));
    }
  }
};


/* ------------------------------------------------------------------ *
 *  Context-Menu & Scrollbars
 * ------------------------------------------------------------------ */
map.on("contextmenu", evt => {
  const items = [];
  if (document.body.classList.contains("is-admin")) {
    items.push({
      text: "Create New Marker",
      action: () => {
        markerForm.openCreate(
          [evt.latlng.lat, evt.latlng.lng],
          "Item",
          evt.originalEvent,
          newData => addAndPersist(newData)
        );
      }
    });
  }
  showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, items);
});

document.addEventListener("click", e => {
  const cm = document.getElementById("context-menu");
  if (cm && cm.style.display === "block" && !cm.contains(e.target)) {
    cm.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  activateFloatingScrollbars();
});

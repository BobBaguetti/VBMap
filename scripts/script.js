// @file: /scripts/script.js
// @version: 5.13

import { initializeApp }   from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  getIdTokenResult
}                          from "firebase/auth";
import { getFirestore }     from "firebase/firestore";

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

// for admin login UI
import { initAdminAuth } from "./authSetup.js";


/* ------------------------------------------------------------------ *
 *  Firebase Configuration & Initialization
 * ------------------------------------------------------------------ */
const firebaseConfig = {
  apiKey:            "AIzaSyDwEdPK3UdPN5MB8YAuM_jb0K1iXfQ-tGQ",
  authDomain:        "vbmap-cc834.firebaseapp.com",
  projectId:         "vbmap-cc834",
  storageBucket:     "vbmap-cc834.appspot.com",
  messagingSenderId: "244112699360",
  appId:             "1:244112699360:web:95f50adb6e10b438238585",
  measurementId:     "G-7FDNWLRM95"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);


/* ------------------------------------------------------------------ *
 *  Map & Layers Setup
 * ------------------------------------------------------------------ */
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

Object.entries(layers).forEach(([key, layer]) => {
  if (key !== "Item") layer.addTo(map);
});
flatItemLayer.addTo(map);

let groupingOn = false;


/* ------------------------------------------------------------------ *
 *  Sidebar Setup
 * ------------------------------------------------------------------ */
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

const { filterMarkers, loadItemFilters } = await setupSidebar(
  map, layers, allMarkers, db, groupingCallbacks
);

// ← initialise your admin‐login UI
initAdminAuth(auth);

// ← watch for auth changes and toggle the “is-admin” class on <body>
onAuthStateChanged(auth, async user => {
  const isAdmin = Boolean(
    user &&
    (await getIdTokenResult(user)).claims.admin
  );
  if (isAdmin) {
    document.body.classList.add("is-admin");
  } else {
    document.body.classList.remove("is-admin");
  }
});


/* ------------------------------------------------------------------ *
 *  Marker Modal
 * ------------------------------------------------------------------ */
const markerForm = initMarkerModal(db);


/* ------------------------------------------------------------------ *
 *  Definitions Modals & Subscriptions
 * ------------------------------------------------------------------ */
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

    if (def.itemType) {
      data.itemType      = def.itemType;
      data.itemTypeColor = def.itemTypeColor || "#E5E6E8";
    }

    // update popup content for everyone
    markerObj.setPopupContent(renderPopup(data));

    // only persist back to Firestore for admins
    if (document.body.classList.contains("is-admin")) {
      firebaseUpdateMarker(db, data)
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
  data.id         = saved.id;
  return markerObj;
}


/* ------------------------------------------------------------------ *
 *  Copy-Paste Manager & Marker Management
 * ------------------------------------------------------------------ */
const copyMgr = initCopyPasteManager(map, addAndPersist);

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
  onDragEnd:(_, data) => firebaseUpdateMarker(db, data),
  onDelete:(markerObj, data) => {
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
 *  Map Context-Menu & Floating Scrollbars
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

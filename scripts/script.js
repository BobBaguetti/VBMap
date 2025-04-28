// @file: scripts/script.js
// @version: 6.0 – unified Chest into the generic markers pipeline

import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { firebaseConfig } from "../src/firebaseConfig.js";

import { initializeMap }   from "./modules/map/map.js";
import { showContextMenu } from "./modules/ui/uiManager.js";

import {
  loadMarkers,
  addMarker    as firebaseAddMarker,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "./modules/services/firebaseService.js";

import {
  subscribeChestDefinitions
} from "./modules/services/chestDefinitionsService.js";

import {
  createChestMarker,
  buildChestPopupHTML
} from "./modules/map/chestManager.js";

import {
  createMarker,
  renderPopup,
  createCustomIcon
} from "./modules/map/markerManager.js";

import { saveChest }                   from "./modules/services/chestsService.js";
import { initItemDefinitionsModal }    from "./modules/ui/modals/itemDefinitionsModal.js";
import { initMarkerModal }             from "./modules/ui/modals/markerModal.js";
import { initCopyPasteManager }        from "./modules/map/copyPasteManager.js";
import { setupSidebar }                from "./modules/sidebar/sidebarManager.js";
import { subscribeItemDefinitions }    from "./modules/services/itemDefinitionsService.js";
import { initQuestDefinitionsModal }   from "./modules/ui/modals/questDefinitionsModal.js";
import { activateFloatingScrollbars }  from "./modules/utils/scrollUtils.js";
import { initAdminAuth }               from "./authSetup.js";
import { initChestLayer }              from "./modules/map/chestController.js";

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
  "Spawn Point":      L.layerGroup(),
  Chest:              L.layerGroup()
};

// mount all non-Item layers immediately
Object.entries(layers).forEach(([type, layer]) => {
  if (type !== "Item") layer.addTo(map);
});
flatItemLayer.addTo(map);

// — Load Chest Definitions for lookup
let chestDefMap = {};
subscribeChestDefinitions(db, defs => {
  chestDefMap = Object.fromEntries(defs.map(d => [d.id, d]));
});

/* ------------------------------------------------------------------ *
 *  Admin Auth → Sidebar → Marker Load → Definitions
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
  },
  disableGrouping: () => {
    clusterItemLayer.eachLayer(m => {
      clusterItemLayer.removeLayer(m);
      flatItemLayer.addLayer(m);
    });
    map.removeLayer(clusterItemLayer);
    map.addLayer(flatItemLayer);
    layers.Item = flatItemLayer;
  }
};

let filterMarkers, loadItemFilters;
let initialized = false;

onAuthStateChanged(auth, async user => {
  const claims  = user ? (await getIdTokenResult(user)).claims : {};
  const isAdmin = Boolean(claims.admin);
  document.body.classList.toggle("is-admin", isAdmin);

  if (!initialized && user !== null) {
    // 1) Sidebar
    ({ filterMarkers, loadItemFilters } = await setupSidebar(
      map, layers, allMarkers, db, groupingCallbacks
    ));

    // 2) Existing markers (single collection)
    const markers = await loadMarkers(db);
    markers.forEach(m => {
      if (!m.type || !layers[m.type]) return;

      if (m.type === "Chest") {
        const def      = chestDefMap[m.chestTypeId] || { lootPool: [] };
        const marker   = createChestMarker(
          m, def, map, layers, showContextMenu, isAdmin
        );
        marker.__chestData = m;
        allMarkers.push({ markerObj: marker, data: m });
      } else {
        const markerObj = createMarker(
          m, map, layers, showContextMenu, callbacks, isAdmin
        );
        flatItemLayer.hasLayer(markerObj)
          ? flatItemLayer.addLayer(markerObj)
          : clusterItemLayer.addLayer(markerObj);
        allMarkers.push({ markerObj, data: m });
      }
    });

    // 3) Live item-defs → filters
    subscribeItemDefinitions(db, async () => {
      const { loadItemDefinitions } = await import(
        "./modules/services/itemDefinitionsService.js"
      );
      const defsList = await loadItemDefinitions(db);
      const defMap   = Object.fromEntries(defsList.map(d => [d.id, d]));
      allMarkers.forEach(({ markerObj, data }) => {
        if (data.predefinedItemId) {
          const def = defMap[data.predefinedItemId];
          Object.assign(data, {
            name:        def.name,
            nameColor:   def.nameColor,
            rarity:      def.rarity,
            rarityColor: def.rarityColor,
            description: def.description,
            extraLines:  JSON.parse(JSON.stringify(def.extraLines||[])),
            imageSmall:  def.imageSmall,
            imageBig:    def.imageBig,
            value:       def.value,
            quantity:    def.quantity
          });
          markerObj.setIcon(createCustomIcon(data));
          markerObj.setPopupContent(renderPopup(data));
          if (isAdmin) firebaseUpdateMarker(db, data).catch(() => {});
        }
      });
      await loadItemFilters();
      filterMarkers();
    });

    // 4) Initial filter
    await loadItemFilters();
    filterMarkers();

    initialized = true;
  } else if (initialized) {
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

/* ------------------------------------------------------------------ *
 *  Add & Persist Marker (with branching for Chest)
 * ------------------------------------------------------------------ */
async function addAndPersist(data) {
  let markerObj;
  if (data.type === "Chest") {
    // create UI chest marker
    const def      = chestDefMap[data.chestTypeId] || { lootPool: [] };
    markerObj      = createChestMarker(
      data, def, map, layers, showContextMenu,
      document.body.classList.contains("is-admin")
    );
    data.id = (await firebaseAddMarker(db, data)).id;
  } else {
    // generic flow
    markerObj = addMarker(data, callbacks);
    const saved = await firebaseAddMarker(db, data);
    data.id = saved.id;
    if (data.predefinedItemId) {
      // hydrate item definitions as before...
    }
  }
  return markerObj;
}

/* ------------------------------------------------------------------ *
 *  Copy-Paste & Marker Management
 * ------------------------------------------------------------------ */
const copyMgr = initCopyPasteManager(map, addAndPersist);

function addMarker(data, cbs = {}) {
  // NOTE: we no longer call createChestMarker here; chest uses addAndPersist branch
  const isAdmin  = document.body.classList.contains("is-admin");
  const markerObj = createMarker(
    data, map, layers, showContextMenu, cbs, isAdmin
  );
  if (groupingOn) clusterItemLayer.addLayer(markerObj);
  else            flatItemLayer.addLayer(markerObj);
  allMarkers.push({ markerObj, data });
  return markerObj;
}

const callbacks = {
  onEdit:    (m,d,ev) => markerForm.openEdit(m,d,ev, updated => {
                 m.setIcon(createCustomIcon(updated));
                 m.setPopupContent(renderPopup(updated));
                 firebaseUpdateMarker(db, updated).catch(() => {});
               }),
  onCopy:    (_,d)    => copyMgr.startCopy(d),
  onDragEnd: (_,d)    => firebaseUpdateMarker(db, d).catch(() => {}),
  onDelete:  (m,d)    => {
                 layers[d.type].removeLayer(m);
                 const idx = allMarkers.findIndex(o => o.data.id === d.id);
                 if (idx !== -1) allMarkers.splice(idx,1);
                 if (d.id) firebaseDeleteMarker(db, d.id).catch(() => {});
               }
};

/* ------------------------------------------------------------------ *
 *  Context-Menu & Scrollbars
 * ------------------------------------------------------------------ */
// only one “Create New Marker” needed—no separate chest action
map.on("contextmenu", evt => {
  const items = [];
  if (document.body.classList.contains("is-admin")) {
    items.push({
      text: "Create New Marker",
      action: () => {
        markerForm.openCreate(
          [evt.latlng.lat, evt.latlng.lng],
          undefined, // no type override—modal will let you choose
          evt.originalEvent,
          addAndPersist
        );
      }
    });
  }
  showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, items);
});

document.addEventListener("click", e => {
  const cm = document.getElementById("context-menu");
  if (cm?.style.display === "block" && !cm.contains(e.target)) {
    cm.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", activateFloatingScrollbars);

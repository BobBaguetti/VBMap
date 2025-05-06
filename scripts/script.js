// @file: scripts/script.js
// @version: 7.13 – wire in chestDefinitionsModal alongside item & quest

import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { firebaseConfig } from "../src/firebaseConfig.js";

import { initializeMap }     from "./modules/map/map.js";
import { showContextMenu, hideContextMenu } from "./modules/ui/uiManager.js";

import {
  subscribeMarkers,
  upsertMarker,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "./modules/services/markerService.js";

import { subscribeChestDefinitions } from "./modules/services/chestDefinitionsService.js";

import {
  createMarker,
  renderPopup,
  createCustomIcon,
  renderChestPopup
} from "./modules/map/markerManager.js";

import { initItemDefinitionsModal }   from "./modules/ui/modals/itemDefinitionsModal.js";
import { initChestDefinitionsModal }  from "./modules/ui/modals/chestDefinitionsModal.js";  // ← added
import { initMarkerModal }            from "./modules/ui/modals/markerModal.js";
import { initCopyPasteManager }       from "./modules/map/copyPasteManager.js";
import { setupSidebar }               from "./modules/sidebar/sidebarManager.js";
import { subscribeItemDefinitions }   from "./modules/services/itemDefinitionsService.js";
import { initQuestDefinitionsModal }  from "./modules/ui/modals/questDefinitionsModal.js";
import { activateFloatingScrollbars } from "./modules/utils/scrollUtils.js";
import { initAdminAuth }              from "./authSetup.js";

/* ───────────────────────── Firebase & Map ───────────────────────── */
const app   = initializeApp(firebaseConfig);
const auth  = getAuth(app);
const db    = getFirestore(app);

const { map }          = initializeMap();
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
Object.entries(layers).forEach(([t,l]) => { if (t !== "Item") l.addTo(map); });
flatItemLayer.addTo(map);

/* ─────────────── live chest & item definitions ──────────────────── */
let chestDefMap = {};
let itemDefMap  = {};

subscribeChestDefinitions(db, defs => {
  chestDefMap = Object.fromEntries(defs.map(d => [d.id, d]));
});

/* ───────────────────── Auth ⟶ Sidebar ⟶ Markers ─────────────────── */
initAdminAuth();

const allMarkers = [];
let filterMarkers, loadItemFilters;
let initialized = false;

onAuthStateChanged(auth, async user => {
  const claims  = user ? (await getIdTokenResult(user)).claims : {};
  const isAdmin = Boolean(claims.admin);
  document.body.classList.toggle("is-admin", isAdmin);

  if (!initialized && user) {
    ({ filterMarkers, loadItemFilters } = await setupSidebar(
      map, layers, allMarkers, db, {}
    ));

    const { loadItemDefinitions } = await import(
      "./modules/services/itemDefinitionsService.js"
    );
    itemDefMap = Object.fromEntries(
      (await loadItemDefinitions(db)).map(i => [i.id,i])
    );

    /* ───── subscribe to markers ───────────────────────────────── */
    subscribeMarkers(db, markers => {
      // clear existing
      allMarkers.forEach(({ markerObj }) => {
        markerObj.remove();
        clusterItemLayer.removeLayer(markerObj);
      });
      allMarkers.length = 0;

      // re-add each
      markers.forEach(data => addMarker(data, callbacks));
      loadItemFilters().then(filterMarkers);
    });

    /* ─── live item-definition hydration ───────────────────────── */
    subscribeItemDefinitions(db, async () => {
      const { loadItemDefinitions } = await import(
        "./modules/services/itemDefinitionsService.js"
      );
      const defs = await loadItemDefinitions(db);
      itemDefMap = Object.fromEntries(defs.map(d => [d.id, d]));

      allMarkers.forEach(({ markerObj, data }) => {
        if (data.predefinedItemId) {
          const def = itemDefMap[data.predefinedItemId] || {};
          const { id: _ignored, ...defFields } = def;
          Object.assign(data, defFields);

          markerObj.setIcon(createCustomIcon(data));
          markerObj.setPopupContent(renderPopup(data));
          if (isAdmin) firebaseUpdateMarker(db, data).catch(() => {});
        } else if (data.type === "Chest") {
          const def      = chestDefMap[data.chestTypeId] || { lootPool: [] };
          const fullDef  = {
            ...def,
            lootPool: (def.lootPool || [])
              .map(id => itemDefMap[id])
              .filter(Boolean)
          };
          markerObj.setPopupContent(renderChestPopup(fullDef));
        }
      });

      await loadItemFilters();
      filterMarkers();
    });

    initialized = true;
  }
});

/* ─────────────────── Marker & Definition Modals ─────────────────── */
const markerForm = initMarkerModal(db);
const itemModal  = initItemDefinitionsModal(db);
const chestModal = initChestDefinitionsModal(db);   // ← added
const questModal = initQuestDefinitionsModal(db);

// TODO: hook these up to your admin UI—e.g.:
// document.getElementById('btn-manage-chests').onclick = () => chestModal.open();

/* ─────────────── Create & Persist helper ────────────────────────── */
async function addAndPersist(data) {
  await upsertMarker(db, data);
}

/* ───────────────── Copy-Paste & Marker utilities ─────────────────── */
const copyMgr = initCopyPasteManager(map, addAndPersist);

function addMarker(data, cbs = {}) {
  const isAdmin = document.body.classList.contains("is-admin");

  if (data.type === "Chest") {
    const def      = chestDefMap[data.chestTypeId] || { lootPool: [] };
    const fullDef  = {
      ...def,
      lootPool: (def.lootPool || []).map(id => itemDefMap[id]).filter(Boolean)
    };
    data.name         = fullDef.name;
    data.imageSmall   = fullDef.iconUrl;
    data.chestDefFull = fullDef;

    const markerObj = createMarker(
      data, map, layers, showContextMenu, cbs, isAdmin
    );
    markerObj.setPopupContent(renderChestPopup(fullDef));
    allMarkers.push({ markerObj, data });
    return markerObj;
  }

  const markerObj = createMarker(
    data, map, layers, showContextMenu, cbs, isAdmin
  );
  (clusterItemLayer.hasLayer(markerObj)
    ? clusterItemLayer
    : flatItemLayer
  ).addLayer(markerObj);

  allMarkers.push({ markerObj, data });
  return markerObj;
}

const callbacks = {
  onEdit: (m, d, e) => markerForm.openEdit(m, d, e, updated => {
    m.setIcon(createCustomIcon(updated));
    m.setPopupContent(
      updated.type === "Chest"
        ? renderChestPopup(updated.chestDefFull || {})
        : renderPopup(updated)
    );
    firebaseUpdateMarker(db, updated).catch(() => {});
  }),

  onCopy: (_, d) => copyMgr.startCopy(d),

  onDragEnd: (_, d) => {
    firebaseUpdateMarker(db, d).catch(() => {});
  },

  onDelete: (markerObj, data) => {
    markerObj.remove();
    clusterItemLayer.removeLayer(markerObj);
    const idx = allMarkers.findIndex(o => o.data.id === data.id);
    if (idx !== -1) allMarkers.splice(idx, 1);
    if (data.id) firebaseDeleteMarker(db, data.id).catch(() => {});
    hideContextMenu();
  }
};

/* ───────────────── Context-menu & scrollbars ─────────────────────── */
map.on("contextmenu", evt => {
  if (!document.body.classList.contains("is-admin")) return;
  showContextMenu(
    evt.originalEvent.pageX,
    evt.originalEvent.pageY,
    [{
      text: "Create New Marker",
      action: () => markerForm.openCreate(
        [evt.latlng.lat, evt.latlng.lng],
        undefined,
        evt.originalEvent,
        addAndPersist
      )
    }]
  );
});

document.addEventListener("click", e => {
  const cm = document.getElementById("context-menu");
  if (cm?.style.display === "block" && !cm.contains(e.target)) {
    cm.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", activateFloatingScrollbars);

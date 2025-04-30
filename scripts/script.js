// @file: scripts/script.js
// @version: 7.1 – added immediate re-query after delete to verify Firestore state

import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { firebaseConfig } from "../src/firebaseConfig.js";

import { initializeMap }   from "./modules/map/map.js";
import { showContextMenu, hideContextMenu } from "./modules/ui/uiManager.js";

import {
  loadMarkers,
  addMarker    as firebaseAddMarker,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "./modules/services/firebaseService.js";

import { subscribeChestDefinitions } from "./modules/services/chestDefinitionsService.js";

import {
  createMarker,
  renderPopup,
  createCustomIcon,
  renderChestPopup
} from "./modules/map/markerManager.js";

import { initItemDefinitionsModal }  from "./modules/ui/modals/itemDefinitionsModal.js";
import { initMarkerModal }           from "./modules/ui/modals/markerModal.js";
import { initCopyPasteManager }      from "./modules/map/copyPasteManager.js";
import { setupSidebar }              from "./modules/sidebar/sidebarManager.js";
import { subscribeItemDefinitions }  from "./modules/services/itemDefinitionsService.js";
import { initQuestDefinitionsModal } from "./modules/ui/modals/questDefinitionsModal.js";
import { activateFloatingScrollbars }from "./modules/utils/scrollUtils.js";
import { initAdminAuth }             from "./authSetup.js";

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
// mount non-Item layers immediately
Object.entries(layers).forEach(([t,l])=>{ if(t!=="Item") l.addTo(map); });
flatItemLayer.addTo(map);

/* ─────────────── live chest & item definitions ──────────────────── */
let chestDefMap = {};
let itemDefMap  = {};

subscribeChestDefinitions(db, defs=>{
  chestDefMap = Object.fromEntries(defs.map(d=>[d.id,d]));
});

/* ───────────────────── Auth ⟶ Sidebar ⟶ Markers ─────────────────── */
initAdminAuth();

const allMarkers = [];
let filterMarkers, loadItemFilters;
let initialized = false;

onAuthStateChanged(auth, async user=>{
  const claims  = user ? (await getIdTokenResult(user)).claims : {};
  const isAdmin = Boolean(claims.admin);
  document.body.classList.toggle("is-admin", isAdmin);

  if (!initialized && user) {
    /* 1) sidebar */
    ({ filterMarkers, loadItemFilters } = await setupSidebar(
      map, layers, allMarkers, db, {}
    ));

    /* 2) preload item defs once for chest popups */
    const { loadItemDefinitions } = await import(
      "./modules/services/itemDefinitionsService.js"
    );
    itemDefMap = Object.fromEntries(
      (await loadItemDefinitions(db)).map(i=>[i.id,i])
    );

    /* 3) existing markers */
    const markers = await loadMarkers(db);
    markers.forEach(m => addMarker(m, callbacks));

    /* 4) live item-definition hydration */
    subscribeItemDefinitions(db, async () => {
      const { loadItemDefinitions } = await import(
        "./modules/services/itemDefinitionsService.js"
      );
      const defs = await loadItemDefinitions(db);
      itemDefMap = Object.fromEntries(defs.map(d=>[d.id,d]));

      allMarkers.forEach(({ markerObj, data }) => {
        if (data.predefinedItemId) {
          const def = itemDefMap[data.predefinedItemId];
          Object.assign(data, def);
          markerObj.setIcon(createCustomIcon(data));
          markerObj.setPopupContent(renderPopup(data));
          if (isAdmin) firebaseUpdateMarker(db, data).catch(()=>{});
        } else if (data.type === "Chest") {
          const def = chestDefMap[data.chestTypeId] || { lootPool: [] };
          const fullDef = {
            ...def,
            lootPool:(def.lootPool||[])
              .map(id=>itemDefMap[id]).filter(Boolean)
          };
          markerObj.setPopupContent(renderChestPopup(fullDef));
        }
      });

      await loadItemFilters();
      filterMarkers();
    });

    /* 5) initial filter */
    await loadItemFilters();
    filterMarkers();

    initialized = true;
  } else if (initialized) {
    await loadItemFilters();
    filterMarkers();
  }
});

/* ─────────────────── Marker & Definition Modals ─────────────────── */
const markerForm = initMarkerModal(db);
const itemModal  = initItemDefinitionsModal(db);
const questModal = initQuestDefinitionsModal(db);

/* ─────────────── Add & Persist helper (all types) ────────────────── */
async function addAndPersist(data) {
  const markerObj = addMarker(data, callbacks);
  const saved     = await firebaseAddMarker(db, data);
  data.id = saved.id;
  return markerObj;
}

/* ───────────────── Copy-Paste & Marker utilities ─────────────────── */
const copyMgr = initCopyPasteManager(map, addAndPersist);

function addMarker(data, cbs={}) {
  const isAdmin = document.body.classList.contains("is-admin");

  // Chest → derive UI fields + popup definition
  if (data.type==="Chest") {
    const def      = chestDefMap[data.chestTypeId] || { lootPool: [] };
    const fullDef  = {
      ...def,
      lootPool:(def.lootPool||[]).map(id=>itemDefMap[id]).filter(Boolean)
    };
    data.name        = fullDef.name;
    data.imageSmall  = fullDef.iconUrl;
    data.chestDefFull= fullDef;         // used by markerManager

    const markerObj = createMarker(
      data, map, layers, showContextMenu, cbs, isAdmin
    );
    markerObj.setPopupContent(renderChestPopup(fullDef));
    allMarkers.push({ markerObj, data });
    return markerObj;
  }

  // Everything else (Items, Doors, Teleport, etc.)
  const markerObj = createMarker(
    data, map, layers, showContextMenu, cbs, isAdmin
  );
  (clusterItemLayer.hasLayer(markerObj) ? clusterItemLayer : flatItemLayer)
    .addLayer(markerObj);
  allMarkers.push({ markerObj, data });
  return markerObj;
}

const callbacks = {
  onEdit:    (m,d,e)=>markerForm.openEdit(m,d,e,updated=>{
               m.setIcon(createCustomIcon(updated));
               m.setPopupContent(
                 updated.type==="Chest"
                   ? renderChestPopup(updated.chestDefFull||{})
                   : renderPopup(updated)
               );
               firebaseUpdateMarker(db, updated).catch(()=>{});
             }),
  onCopy:    (_,d)=>copyMgr.startCopy(d),
  onDragEnd: (_,d)=>firebaseUpdateMarker(db,d).catch(()=>{}),
  onDelete:  async (markerObj, data) => {
               console.log("Deleting marker:", data.id, data.type);

               // remove from map/layers
               if (markerObj.remove) {
                 markerObj.remove();
               } else {
                 layers[data.type]?.removeLayer(markerObj);
               }
               // also ensure cluster removal
               clusterItemLayer.removeLayer(markerObj);

               // remove from in-memory store
               const idx = allMarkers.findIndex(o=>o.data.id===data.id);
               if (idx!==-1) allMarkers.splice(idx,1);

               // delete from Firestore + verify
               if (data.id) {
                 firebaseDeleteMarker(db, data.id)
                   .then(async () => {
                     console.log("Marker deleted from Firestore", data.id);
                     const current = await loadMarkers(db);
                     console.log("Post-delete loadMarkers IDs:", current.map(m => m.id));
                   })
                   .catch(err => console.error("Delete failed:", err));
               }

               // hide context menu
               hideContextMenu();
             }
};

/* ───────────────── Context-menu & scrollbars ───────────────────────*/
map.on("contextmenu", evt=>{
  if (!document.body.classList.contains("is-admin")) return;
  showContextMenu(evt.originalEvent.pageX,evt.originalEvent.pageY,[{
    text:"Create New Marker",
    action:()=>markerForm.openCreate(
      [evt.latlng.lat,evt.latlng.lng],undefined,evt.originalEvent,addAndPersist
    )
  }]);
});
document.addEventListener("click",e=>{
  const cm=document.getElementById("context-menu");
  if(cm?.style.display==="block"&&!cm.contains(e.target)) cm.style.display="none";
});
document.addEventListener("DOMContentLoaded", activateFloatingScrollbars);

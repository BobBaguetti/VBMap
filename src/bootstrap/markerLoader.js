// @file: src/bootstrap/markerLoader.js
// @version: 1.21 — update only the .chest-grid innerHTML on popup open

import {
  subscribeMarkers,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "../modules/services/firebaseService.js";
import definitionsManager from "./definitionsManager.js";
import {
  createMarker
} from "../modules/map/markerManager.js";
import { markerTypes } from "../modules/marker/types.js";
import { showContextMenu, hideContextMenu }
  from "../modules/context-menu/index.js";
import {
  rarityColors,
  defaultNameColor
} from "../shared/utils/color/colorPresets.js";

let groupingEnabled = false;

export function setGrouping(enabled) {
  groupingEnabled = enabled;
}

export const allMarkers = [];

/**
 * Normalize a chest’s lootPool from [id, …] → [itemObj, …].
 */
function normalizeChestLootPool(data) {
  if (!Array.isArray(data.lootPool)) return;
  const itemDefMap = definitionsManager.getDefinitions("Item") || {};
  data.lootPool = data.lootPool
    .map(id => itemDefMap[id])
    .filter(i => !!i);
}

/**
 * When a chest popup opens, fetch the very latest definition (including updated lootPool),
 * rebuild only the <div class="chest-grid"> contents (5 slots), and leave the rest untouched.
 */
function refreshChestSlots(markerObj, originalData, cfg) {
  const defMap = definitionsManager.getDefinitions("Chest");
  const defKey = cfg.defIdKey;
  const freshDef = defMap[originalData[defKey]];
  if (!freshDef) return;

  // Normalize IDs → objects
  const itemMap = definitionsManager.getDefinitions("Item") || {};
  const normalized = (freshDef.lootPool || [])
    .map(id => itemMap[id])
    .filter(it => it && (it.imageSmall || it.imageLarge));

  // Find the existing chest-grid element inside the popup
  const popupEl = markerObj.getPopup().getElement();
  const gridContainer = popupEl.querySelector(".chest-grid");
  if (!gridContainer) return;

  // Rebuild only the slots
  const COLS = 5;
  let newCells = "";

  normalized.forEach((item, idx) => {
    const imgUrl = item.imageSmall || item.imageLarge || "";
    const clr = item.rarityColor
      || rarityColors[(item.rarity || "").toLowerCase()]
      || defaultNameColor;

    newCells += `
      <div class="chest-slot" data-item-id="${item.id}"
           style="border-color:${clr}">
        <img src="${imgUrl}" class="chest-slot-img"
             onerror="this.style.display='none'">
        ${item.quantity > 1
          ? `<span class="chest-slot-qty">${item.quantity}</span>`
          : ""}
      </div>`;
  });

  for (let i = normalized.length; i < COLS; i++) {
    newCells += `<div class="chest-slot" data-item-id=""></div>`;
  }

  gridContainer.innerHTML = newCells;
}

export async function init(
  db,
  map,
  clusterItemLayer,
  flatItemLayer,
  filterMarkers,
  loadItemFilters,
  isAdmin,
  callbacks = {}
) {
  const { markerForm, copyMgr } = callbacks;

  // 1) Marker subscription
  subscribeMarkers(db, markers => {
    // a) Clear existing
    allMarkers.forEach(({ markerObj }) => {
      markerObj.remove();
      clusterItemLayer.removeLayer(markerObj);
      flatItemLayer.removeLayer(markerObj);
    });
    allMarkers.length = 0;

    // b) Rebuild
    markers.forEach(data => {
      const cfg = markerTypes[data.type];
      if (!cfg) return;

      // Merge definition fields
      const defMap = definitionsManager.getDefinitions(data.type);
      const defKey = cfg.defIdKey;
      if (defKey && defMap[data[defKey]]) {
        const { id: _ignore, ...fields } = defMap[data[defKey]];
        Object.assign(data, fields);

        if (data.type === "Chest") {
          normalizeChestLootPool(data);
        }
      }

      // Context‐menu callbacks
      const cb = {
        onEdit: (markerObj, originalData, e) =>
          markerForm.openEdit(markerObj, originalData, e, payload => {
            const updated = { ...originalData, ...payload };

            if (updated.type === "Chest" && Array.isArray(payload.lootPool)) {
              updated.lootPool = payload.lootPool.map(itemObj => itemObj.id);
            }

            markerObj.setIcon(cfg.iconFactory(updated));
            markerObj.setPopupContent(cfg.popupRenderer(updated));

            firebaseUpdateMarker(db, updated);
          }),

        onCopy: (_, d) => copyMgr.startCopy(d),

        onDragEnd: (_, d) => firebaseUpdateMarker(db, d),

        onDelete: (markerObj, d) => {
          firebaseDeleteMarker(db, d.id);
          hideContextMenu();
          markerObj.remove();
          const idx = allMarkers.findIndex(o => o.data.id === d.id);
          if (idx > -1) allMarkers.splice(idx, 1);
        }
      };

      // Create marker and bind popup
      const markerObj = createMarker(
        data,
        map,
        { clusterItemLayer, flatItemLayer },
        showContextMenu,
        cb,
        isAdmin
      );

      markerObj.bindPopup(cfg.popupRenderer(data));
      markerObj.on("popupopen", () =>
        refreshChestSlots(markerObj, data, cfg)
      );

      // Add to layer
      const layerToUse = groupingEnabled ? clusterItemLayer : flatItemLayer;
      layerToUse.addLayer(markerObj);
      allMarkers.push({ markerObj, data });
    });

    // c) Reapply filters
    filterMarkers();
  });

  // 2) Definition updates (including chests)
  Object.entries(markerTypes).forEach(([type, cfg]) => {
    if (!cfg.subscribeDefinitions) return;
    cfg.subscribeDefinitions(db, defs => {
      allMarkers.forEach(({ markerObj, data }) => {
        if (data.type !== type) return;

        const defMap = definitionsManager.getDefinitions(type);
        const defKey = cfg.defIdKey;
        if (defKey && defMap[data[defKey]]) {
          const { id: _ignore, ...fields } = defMap[data[defKey]];
          Object.assign(data, fields);

          if (data.type === "Chest") {
            normalizeChestLootPool(data);
          }
        }

        markerObj.setIcon(cfg.iconFactory(data));
        markerObj.setPopupContent(cfg.popupRenderer(data));
      });

      filterMarkers();
    });
  });

  // 3) Load initial definitions
  for (const [type, cfg] of Object.entries(markerTypes)) {
    const defs = await cfg.loadDefinitions(db);
    definitionsManager.getDefinitions(type);
  }

  await loadItemFilters();
  filterMarkers();
}

export default {
  init,
  allMarkers
};

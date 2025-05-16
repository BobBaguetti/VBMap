// @file: src/bootstrap/markerLoader.js
// @version: 1.0 — subscribe to markers & definitions; manage marker lifecycle

import {
  subscribeMarkers,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "../modules/services/firebaseService.js";
import { subscribeItemDefinitions } from "../modules/services/itemDefinitionsService.js";
import definitionsManager from "./definitionsManager.js";
import {
  createMarker,
  createCustomIcon,
  renderItemPopup,
  renderChestPopup
} from "../modules/map/markerManager.js";

export const allMarkers = [];

/**
 * Initialize marker subscriptions, addition, and hydration.
 *
 * @param {Firestore} db
 * @param {L.Map} map
 * @param {Object} layers         – map layers { clusterItemLayer, flatItemLayer }
 * @param {Function} filterMarkers
 * @param {Function} loadItemFilters
 * @param {boolean} isAdmin
 * @param {Function} callbackProvider – returns { onEdit, onCopy, onDragEnd, onDelete }
 */
export async function init(
  db,
  map,
  layers,
  filterMarkers,
  loadItemFilters,
  isAdmin,
  callbackProvider = () => ({})
) {
  const { clusterItemLayer, flatItemLayer } = layers;

  // 1) Subscribe to marker updates
  subscribeMarkers(db, markers => {
    // Clear existing
    allMarkers.forEach(({ markerObj }) => {
      markerObj.remove();
      clusterItemLayer.removeLayer(markerObj);
    });
    allMarkers.length = 0;

    // Add incoming markers
    markers.forEach(data => {
      addMarker(db, map, layers, data, isAdmin, callbackProvider());
    });

    // Refresh filters
    loadItemFilters().then(filterMarkers);
  });

  // 2) Hydrate markers on item-definition changes
  subscribeItemDefinitions(db, async () => {
    const itemDefMap = definitionsManager.getItemDefMap();
    const chestDefMap = definitionsManager.getChestDefMap();

    allMarkers.forEach(({ markerObj, data }) => {
      if (data.predefinedItemId) {
        const def = itemDefMap[data.predefinedItemId] || {};
        const { id, ...fields } = def;
        Object.assign(data, fields);
        markerObj.setIcon(createCustomIcon(data));
        markerObj.setPopupContent(renderItemPopup(data));
        if (isAdmin) firebaseUpdateMarker(db, data).catch(() => {});
      } else if (data.type === "Chest") {
        const def = chestDefMap[data.chestTypeId] || { lootPool: [] };
        const fullDef = {
          ...def,
          lootPool: (def.lootPool || []).map(id => itemDefMap[id]).filter(Boolean)
        };
        markerObj.setPopupContent(renderChestPopup(fullDef));
      }
    });

    filterMarkers();
  });
}

/**
 * Add a single marker to the map and register callbacks.
 */
function addMarker(db, map, layers, data, isAdmin, callbacks) {
  const { clusterItemLayer, flatItemLayer } = layers;
  const chestDefMap = definitionsManager.getChestDefMap();
  const itemDefMap = definitionsManager.getItemDefMap();

  if (data.type === "Chest") {
    // Enrich chest data
    const def = chestDefMap[data.chestTypeId] || { lootPool: [] };
    const fullDef = {
      ...def,
      lootPool: (def.lootPool || []).map(id => itemDefMap[id]).filter(Boolean)
    };
    data.name = fullDef.name;
    data.imageSmall = fullDef.iconUrl;
    data.chestDefFull = fullDef;

    const markerObj = createMarker(data, map, layers, callbacks);
    markerObj.setPopupContent(renderChestPopup(fullDef));
    allMarkers.push({ markerObj, data });
    return;
  }

  // Standard item marker
  const markerObj = createMarker(data, map, layers, callbacks);
  const targetLayer = clusterItemLayer.hasLayer(markerObj)
    ? clusterItemLayer
    : flatItemLayer;
  targetLayer.addLayer(markerObj);
  markerObj.setPopupContent(renderItemPopup(data));
  allMarkers.push({ markerObj, data });
}

export default {
  init,
  allMarkers
};

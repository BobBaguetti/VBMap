// @file: src/bootstrap/markerLoader.js
// @version: 1.7 — rebuild marker data object from scratch on edit to avoid stale style fields

import {
  subscribeMarkers,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "../modules/services/firebaseService.js";
import definitionsManager from "./definitionsManager.js";
import { markerTypes }    from "../modules/marker/types.js";
import { createMarker }    from "../modules/map/markerManager.js";
import { showContextMenu, hideContextMenu } from "../modules/ui/uiManager.js";

/** @type {{ markerObj: L.Marker, data: object }[]} */
export const allMarkers = [];

/**
 * Initialize marker subscriptions, creation, and hydration.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {L.Map} map
 * @param {L.LayerGroup} clusterItemLayer
 * @param {L.LayerGroup} flatItemLayer
 * @param {() => void} filterMarkers
 * @param {() => Promise<void>} loadItemFilters
 * @param {boolean} isAdmin
 * @param {{ markerForm: object, copyMgr: object }} callbacks
 */
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

  // Subscribe to marker data
  subscribeMarkers(db, markers => {
    // Remove existing
    allMarkers.forEach(({ markerObj }) => {
      markerObj.remove();
      clusterItemLayer.removeLayer(markerObj);
      flatItemLayer.removeLayer(markerObj);
    });
    allMarkers.length = 0;

    markers.forEach(origData => {
      const cfg = markerTypes[origData.type];
      if (!cfg) return;

      // Initial merge of def fields (preserve origData.id, coords)
      const defs   = definitionsManager.getDefinitions(origData.type);
      const defKey = cfg.defIdKey;
      const def    = defKey ? defs[origData[defKey]] : {};
      const { id: _ignore, ...defFields } = def || {};
      const data = {
        id:     origData.id,
        coords: origData.coords,
        type:   origData.type,
        ...(defKey ? { [defKey]: origData[defKey] } : {}),
        ...defFields
      };

      // Context-menu callbacks
      const cb = {
        onEdit: (markerObj, _, event) =>
          markerForm.openEdit(markerObj, data, event, payload => {
            // Build a fresh updated object: keep id, coords, type, defKey, plus new defFields
            const newType   = payload.type;
            const newDefKey = markerTypes[newType].defIdKey;
            const newDefs   = definitionsManager.getDefinitions(newType);
            const newDef    = newDefKey ? newDefs[payload[newDefKey]] : {};
            const { id: _i2, ...newDefFields } = newDef || {};
            const updated = {
              id:     data.id,
              coords: data.coords,
              type:   newType,
              ...(newDefKey ? { [newDefKey]: payload[newDefKey] } : {}),
              ...newDefFields
            };

            // Replace data in our array
            Object.assign(data, updated);

            // Update icon & popup
            markerObj.setIcon(cfg.iconFactory(updated));
            markerObj.setPopupContent(cfg.popupRenderer(updated));

            // Persist to Firestore
            firebaseUpdateMarker(db, updated);
          }),
        onCopy:    (_, d) => copyMgr.startCopy(d),
        onDragEnd: (_, d) => firebaseUpdateMarker(db, d),
        onDelete:  (markerObj, d) => {
          firebaseDeleteMarker(db, d.id);
          hideContextMenu();
          markerObj.remove();
          const idx = allMarkers.findIndex(o => o.data.id === d.id);
          if (idx > -1) allMarkers.splice(idx, 1);
        }
      };

      // Create marker
      const markerObj = createMarker(
        data,
        map,
        { clusterItemLayer, flatItemLayer },
        showContextMenu,
        cb,
        isAdmin
      );

      // Popup
      if (cfg.popupRenderer) {
        markerObj.setPopupContent(cfg.popupRenderer(data));
      }

      // Add to layer
      const layer = clusterItemLayer.hasLayer(markerObj)
        ? clusterItemLayer
        : flatItemLayer;
      layer.addLayer(markerObj);

      allMarkers.push({ markerObj, data });
    });

    filterMarkers();
  });

  // Hydrate on any def updates
  Object.entries(markerTypes).forEach(([type, cfg]) => {
    if (!cfg.subscribeDefinitions) return;
    cfg.subscribeDefinitions(db, defs => {
      // definitionsManager updated behind the scenes
      allMarkers.forEach(({ markerObj, data }) => {
        if (data.type !== type) return;
        const defMap = definitionsManager.getDefinitions(type);
        const defKey = cfg.defIdKey;
        const def    = defKey ? defMap[data[defKey]] : {};
        const { id: _ignore, ...defFields } = def || {};
        Object.assign(data, defFields);
        if (cfg.iconFactory)   markerObj.setIcon(cfg.iconFactory(data));
        if (cfg.popupRenderer) markerObj.setPopupContent(cfg.popupRenderer(data));
      });
      filterMarkers();
    });
  });
}

export default {
  init,
  allMarkers
};

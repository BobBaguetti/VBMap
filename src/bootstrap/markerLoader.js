// @file: src/bootstrap/markerLoader.js
// @version: 1.9 — removed type-change recreation; rely on createCustomIcon for fresh border colors

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

  // 1) Marker data subscription
  subscribeMarkers(db, markers => {
    // Clear
    allMarkers.forEach(({ markerObj }) => {
      markerObj.remove();
      clusterItemLayer.removeLayer(markerObj);
      flatItemLayer.removeLayer(markerObj);
    });
    allMarkers.length = 0;

    // Rebuild
    markers.forEach(data => {
      const cfg = markerTypes[data.type];
      if (!cfg) return;

      // Merge definition fields WITHOUT overwriting data.id
      const defMap = definitionsManager.getDefinitions(data.type);
      const defKey = cfg.defIdKey;
      if (defKey && defMap[data[defKey]]) {
        const { id: _ignore, ...fields } = defMap[data[defKey]];
        Object.assign(data, fields);
      }

      // Callbacks for context-menu
      const cb = {
        onEdit:    (markerObj, originalData, e) =>
          markerForm.openEdit(markerObj, originalData, e, payload => {
            const updated = { ...originalData, ...payload };
            markerObj.setIcon(cfg.iconFactory(updated));
            markerObj.setPopupContent(cfg.popupRenderer(updated));
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

      // Create + add
      const markerObj = createMarker(
        data,
        map,
        { clusterItemLayer, flatItemLayer },
        showContextMenu,
        cb,
        isAdmin
      );
      if (cfg.popupRenderer) markerObj.setPopupContent(cfg.popupRenderer(data));
      const layer = clusterItemLayer.hasLayer(markerObj)
        ? clusterItemLayer
        : flatItemLayer;
      layer.addLayer(markerObj);

      allMarkers.push({ markerObj, data });
    });

    filterMarkers();
  });

  // 2) Re-apply icon & popup on definition changes
  Object.entries(markerTypes).forEach(([type, cfg]) => {
    if (!cfg.subscribeDefinitions) return;
    cfg.subscribeDefinitions(db, defs => {
      // definitionsManager updated already
      allMarkers.forEach(({ markerObj, data }) => {
        if (data.type !== type) return;
        const defMap = definitionsManager.getDefinitions(type);
        const defKey = cfg.defIdKey;
        if (defKey && defMap[data[defKey]]) {
          const { id: _ignore, ...fields } = defMap[data[defKey]];
          Object.assign(data, fields);
        }
        // Always reset icon & popup
        markerObj.setIcon(cfg.iconFactory(data));
        markerObj.setPopupContent(cfg.popupRenderer(data));
      });
      filterMarkers();
    });
  });
}

export default {
  init,
  allMarkers
};

// @file: src/bootstrap/markerLoader.js
// @version: 1.8 — replace marker on type-change to reset icon state and preserve color logic

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

  // 1) Subscribe to marker data (add/remove)
  subscribeMarkers(db, markers => {
    // Clear existing
    allMarkers.forEach(({ markerObj }) => {
      markerObj.remove();
      clusterItemLayer.removeLayer(markerObj);
      flatItemLayer.removeLayer(markerObj);
    });
    allMarkers.length = 0;

    // Add new set
    markers.forEach(data => {
      const cfg = markerTypes[data.type];
      if (!cfg) return;

      // Merge definition fields (excluding def.id)
      const defMap = definitionsManager.getDefinitions(data.type);
      const defKey = cfg.defIdKey;
      if (defKey && defMap[data[defKey]]) {
        const { id: _ignore, ...fields } = defMap[data[defKey]];
        Object.assign(data, fields);
      }

      // Prepare context-menu callbacks
      const cb = {
        onEdit: (markerObj, originalData, event) =>
          markerForm.openEdit(markerObj, originalData, event, payload => {
            // Build full updated data
            const updated = { ...originalData, ...payload };

            // If type changed, replace the marker entirely to reset icon border logic
            if (payload.type !== originalData.type) {
              // Remove old marker
              markerObj.remove();
              clusterItemLayer.removeLayer(markerObj);
              flatItemLayer.removeLayer(markerObj);

              // Create new marker with updated type
              const newCfg = markerTypes[updated.type];
              const newCb = { ...cb }; // reuse callbacks
              const newMarkerObj = createMarker(
                updated,
                map,
                { clusterItemLayer, flatItemLayer },
                showContextMenu,
                newCb,
                isAdmin
              );
              newMarkerObj.setPopupContent(newCfg.popupRenderer(updated));
              const targetLayer = clusterItemLayer.hasLayer(newMarkerObj)
                ? clusterItemLayer
                : flatItemLayer;
              targetLayer.addLayer(newMarkerObj);

              // Replace in allMarkers
              const idx = allMarkers.findIndex(o => o.markerObj === markerObj);
              if (idx !== -1) allMarkers[idx] = { markerObj: newMarkerObj, data: updated };
            } else {
              // Same type: just update icon & popup
              markerObj.setIcon(cfg.iconFactory(updated));
              markerObj.setPopupContent(cfg.popupRenderer(updated));
              // Update in our cache
              const entry = allMarkers.find(o => o.markerObj === markerObj);
              if (entry) entry.data = updated;
            }

            // Persist change
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
      // Set its popup
      if (cfg.popupRenderer) {
        markerObj.setPopupContent(cfg.popupRenderer(data));
      }
      // Add to correct layer
      const layer = clusterItemLayer.hasLayer(markerObj)
        ? clusterItemLayer
        : flatItemLayer;
      layer.addLayer(markerObj);

      allMarkers.push({ markerObj, data });
    });

    // Re-apply filters
    filterMarkers();
  });

  // 2) Hydrate on definition updates
  Object.entries(markerTypes).forEach(([type, cfg]) => {
    if (!cfg.subscribeDefinitions) return;
    cfg.subscribeDefinitions(db, defs => {
      // definitionsManager updated internally
      allMarkers.forEach(({ markerObj, data }) => {
        if (data.type !== type) return;
        const defMap = definitionsManager.getDefinitions(type);
        const defKey = cfg.defIdKey;
        if (defKey && defMap[data[defKey]]) {
          const { id: _ignore, ...fields } = defMap[data[defKey]];
          Object.assign(data, fields);
        }
        // Always re-create icon to pick up new border color
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

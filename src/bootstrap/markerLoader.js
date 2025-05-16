// @file: src/bootstrap/markerLoader.js
// @version: 1.4 — pass showContextMenu to createMarker to fix ctxMenu errors

import {
  subscribeMarkers,
  updateMarker as firebaseUpdateMarker,
  deleteMarker as firebaseDeleteMarker
} from "../modules/services/firebaseService.js";
import definitionsManager from "./definitionsManager.js";
import { markerTypes }    from "../modules/marker/types.js";
import { createMarker }    from "../modules/map/markerManager.js";
import { showContextMenu, hideContextMenu } from "../modules/ui/uiManager.js";

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
  // 1) Subscribe to Firestore marker data
  subscribeMarkers(db, markers => {
    // Clear existing markers
    allMarkers.forEach(({ markerObj }) => {
      markerObj.remove();
      clusterItemLayer.removeLayer(markerObj);
      flatItemLayer.removeLayer(markerObj);
    });
    allMarkers.length = 0;

    // Add incoming markers
    markers.forEach(data => {
      const cfg = markerTypes[data.type];
      if (!cfg) return;

      // Enrich data with its definition
      const defs   = definitionsManager.getDefinitions(data.type);
      const defKey = cfg.defIdKey;
      if (defKey && defs[data[defKey]]) {
        Object.assign(data, defs[data[defKey]]);
      }

      // Build the callback set for edit/copy/drag/delete
      const cb = {
        onEdit:    (m,d,e) => markerForm.openEdit(m,d,e, updated => {
                        m.setIcon(cfg.iconFactory(updated));
                        m.setPopupContent(cfg.popupRenderer(updated));
                        firebaseUpdateMarker(db, updated).catch(()=>{});
                     }),
        onCopy:    (_,d)   => copyMgr.startCopy(d),
        onDragEnd: (_,d)   => firebaseUpdateMarker(db, d).catch(()=>{}),
        onDelete:  (m,d)   => {
                        m.remove();
                        clusterItemLayer.removeLayer(m);
                        flatItemLayer.removeLayer(m);
                        const idx = allMarkers.findIndex(o=>o.data.id===d.id);
                        if (idx>-1) allMarkers.splice(idx,1);
                        if (d.id) firebaseDeleteMarker(db,d.id).catch(()=>{});
                        hideContextMenu();
                     }
      };

      // Create marker with context-menu support
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

      // Add to proper layer
      const layer = clusterItemLayer.hasLayer(markerObj)
        ? clusterItemLayer
        : flatItemLayer;
      layer.addLayer(markerObj);

      allMarkers.push({ markerObj, data });
    });

    // Re-apply the existing filters
    filterMarkers();
  });

  // 2) Hydrate on definition updates
  Object.entries(markerTypes).forEach(([type, cfg]) => {
    if (!cfg.subscribeDefinitions) return;
    cfg.subscribeDefinitions(db, defs => {
      definitionsManager.getDefinitions(type); // already updated
      allMarkers.forEach(({ markerObj, data }) => {
        if (data.type !== type) return;
        const defMap = definitionsManager.getDefinitions(type);
        const defKey = cfg.defIdKey;
        if (defKey && defMap[data[defKey]]) {
          Object.assign(data, defMap[data[defKey]]);
        }
        if (cfg.iconFactory) {
          markerObj.setIcon(cfg.iconFactory(data));
        }
        if (cfg.popupRenderer) {
          markerObj.setPopupContent(cfg.popupRenderer(data));
        }
      });
      filterMarkers();
    });
  });
}

export default {
  init,
  allMarkers
};

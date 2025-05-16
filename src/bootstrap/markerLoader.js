// @file: src/bootstrap/markerLoader.js
// @version: 1.4 — fix id‐overwrite & wire in markerForm/copyMgr

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
 * @param {{ markerForm, copyMgr }} callbacks
 */
export async function init(
  db, map, clusterItemLayer, flatItemLayer,
  filterMarkers, loadItemFilters, isAdmin,
  callbacks = {}
) {
  const { markerForm, copyMgr } = callbacks;

  // 1) Subscribe → add/remove
  subscribeMarkers(db, markers => {
    allMarkers.forEach(({ markerObj }) => {
      markerObj.remove();
      clusterItemLayer.removeLayer(markerObj);
      flatItemLayer.removeLayer(markerObj);
    });
    allMarkers.length = 0;

    markers.forEach(data => {
      const cfg = markerTypes[data.type];
      if (!cfg) return;

      // — merge defs without stomping data.id —
      const defMap = definitionsManager.getDefinitions(data.type);
      const defKey = cfg.defIdKey;
      if (defKey && defMap[data[defKey]]) {
        const { id: _ignore, ...fields } = defMap[data[defKey]];
        Object.assign(data, fields);
      }

      // build ctx‐menu callbacks
      const cb = {
        onEdit:    (m,d,e) => markerForm.openEdit(m, d, e, updated => {
                       m.setIcon(cfg.iconFactory(updated));
                       m.setPopupContent(cfg.popupRenderer(updated));
                       firebaseUpdateMarker(db, updated);
                     }),
        onCopy:    (_,d)   => copyMgr.startCopy(d),
        onDragEnd: (_,d)   => firebaseUpdateMarker(db, d),
        onDelete:  (m,d)   => {
                       firebaseDeleteMarker(db, d.id);
                       hideContextMenu();
                       m.remove();
                       const idx = allMarkers.findIndex(o=>o.data.id===d.id);
                       if (idx>-1) allMarkers.splice(idx,1);
                     }
      };

      // create + popup + layer
      const markerObj = createMarker(
        data, map,
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

  // 2) Hydrate on def‐updates
  Object.entries(markerTypes).forEach(([type,cfg]) => {
    if (!cfg.subscribeDefinitions) return;
    cfg.subscribeDefinitions(db, defs => {
      definitionsManager.getDefinitions(type); // already updated
      allMarkers.forEach(({ markerObj, data }) => {
        if (data.type !== type) return;
        const defMap = definitionsManager.getDefinitions(type);
        const defKey = cfg.defIdKey;
        if (defKey && defMap[data[defKey]]) {
          const { id: _ignore, ...fields } = defMap[data[defKey]];
          Object.assign(data, fields);
        }
        if (cfg.iconFactory)    markerObj.setIcon(cfg.iconFactory(data));
        if (cfg.popupRenderer)  markerObj.setPopupContent(cfg.popupRenderer(data));
      });
      filterMarkers();
    });
  });
}

export default { init, allMarkers };

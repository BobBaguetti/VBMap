// @file: src/modules/map/groupingService.js
// @version: 1.0 — marker grouping & ungrouping logic

/**
 * @param {Array<{ markerObj: L.Marker, data: object }>} allMarkers
 * @param {{ clusterItemLayer: L.LayerGroup, flatItemLayer: L.LayerGroup }} layers
 */
export function createGroupingCallbacks(allMarkers, { clusterItemLayer, flatItemLayer }) {
  function enableGrouping() {
    allMarkers.forEach(({ markerObj, data }) => {
      if (data.type === "Item") {
        flatItemLayer.removeLayer(markerObj);
        clusterItemLayer.addLayer(markerObj);
      }
    });
  }

  function disableGrouping() {
    allMarkers.forEach(({ markerObj, data }) => {
      if (data.type === "Item") {
        clusterItemLayer.removeLayer(markerObj);
        flatItemLayer.addLayer(markerObj);
      }
    });
  }

  return { enableGrouping, disableGrouping };
}

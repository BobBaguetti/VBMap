// @fullfile: Send the entire file, no omissions or abridgments.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 1   The current file version is 1. Increase by 1 every time you update anything.
// @file:    /scripts/modules/map.js

export function initializeMap() {
  // Create the map with custom settings
  const map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 4,
    zoomControl: false
  });
  
  // Add zoom control to the top right
  L.control.zoom({ position: "topright" }).addTo(map);

  // Define the map bounds and overlay image URL
  const bounds = [[0, 0], [3000, 3000]];
  const imageUrl = "./media/images/tempmap.png";

  // Add the overlay image
  L.imageOverlay(imageUrl, bounds).addTo(map);
  
  // Fit the map's bounds to the overlay
  map.fitBounds(bounds);

  // Return map and related configuration for use in other modules
  return { map, bounds };
}

// @version: 1
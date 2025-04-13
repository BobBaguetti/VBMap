console.log("Script loaded!");  // Check if this appears in F12 → Console

// Initialize Map
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -2,
  maxZoom: 4
});

// Set map bounds (match your upscaled image dimensions)
const bounds = [[0, 0], [3000, 3000]];
const imageUrl = './images/tempmap.png';  // Fixed path (removed extra dot)

L.imageOverlay(imageUrl, bounds).addTo(map);
map.fitBounds(bounds);

// Marker layers
const layers = {
  teleports: L.layerGroup().addTo(map),
  extracts: L.layerGroup().addTo(map),
  items: L.layerGroup().addTo(map)
};

// Load markers from JSON
fetch('./data/markerData.json')
  .then(response => response.json())
  .then(data => {
    data.forEach(marker => {
      const icon = L.divIcon({
        html: `<div class="custom-marker" data-type="${marker.type}">${marker.name}</div>`,
        className: ''
      });

      // Fixed marker creation - removed extra bracket
      const markerObj = L.marker(
        [marker.coords[0], marker.coords[1]], 
        { icon: icon }
      ).addTo(layers[marker.type]);

      // Popup content
      const popupContent = `
        <div class="popup-rarity-${marker.rarity || 'common'}">
          <h3>${marker.name}</h3>
          ${marker.image ? `<img src="${marker.image}" width="100"/>` : ''}
          <p>${marker.description}</p>
          ${marker.flavor ? `<div class="flavor-text">${marker.flavor}</div>` : ''}
          ${marker.usage ? `<div class="usage">${marker.usage}</div>` : ''}
        </div>
      `;

      markerObj.bindPopup(popupContent);
    });
  });

// Layer toggles
document.querySelectorAll('.toggle-group input').forEach(toggle => {
  toggle.addEventListener('change', (e) => {
    const layer = e.target.dataset.layer;
    if (e.target.checked) {
      map.addLayer(layers[layer]);
    } else {
      map.removeLayer(layers[layer]);
    }
  });
});

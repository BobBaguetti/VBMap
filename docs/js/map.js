// Initialize Map
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -2,
  maxZoom: 4
}).setView([1500, 1500], 0);

// Add Map Image
const bounds = [[0, 0], [3000, 3000]];
L.imageOverlay('./media/images/map.png', bounds).addTo(map);

// Layer Groups
const layers = {
  item: L.layerGroup().addTo(map),
  teleport: L.layerGroup().addTo(map),
  extraction: L.layerGroup().addTo(map)
};

// Custom Icons
function getIconPath(marker) {
  if (marker.type === 'item') {
    return `./media/images/items/${marker.image}`;
  }
  return `./media/images/world/${marker.type}.png`;
}

// Load Markers
fetch('./data/markerData.json')
  .then(response => response.json())
  .then(markers => {
    markers.forEach(marker => {
      const icon = L.icon({
        iconUrl: getIconPath(marker),
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      
      const popupContent = `
        <div class="popup-content">
          <h3>${marker.name}</h3>
          <p>Type: ${marker.type}</p>
          ${marker.rarity ? `<p>Rarity: ${marker.rarity}</p>` : ''}
          <img src="${getIconPath(marker)}" style="max-width:100px;">
        </div>
      `;
      
      L.marker([marker.coords[0], marker.coords[1]], { icon })
        .addTo(layers[marker.type])
        .bindPopup(popupContent);
    });
  })
  .catch(error => console.error('Error loading markers:', error));
console.log("Script loaded!");

// Initialize Map
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -2,
  maxZoom: 4
});

// Set map bounds
const bounds = [[0, 0], [3000, 3000]];
const imageUrl = './images/tempmap.png';

L.imageOverlay(imageUrl, bounds).addTo(map);
map.fitBounds(bounds);

// Initialize ALL layer groups first
const layerGroups = {
  teleports: new L.LayerGroup(),
  extracts: new L.LayerGroup(), 
  items: new L.LayerGroup()
};

// Add all layer groups to map
Object.values(layerGroups).forEach(group => group.addTo(map));

// Custom icon function
function createCustomIcon(marker) {
  return L.divIcon({
    html: `
      <div class="custom-marker">
        <div class="marker-border"></div>
        ${marker.image ? `<img src="${marker.image}" class="marker-icon"/>` : ''}
      </div>
    `,
    className: 'custom-marker-container',
    iconSize: [32, 32]
  });
}

// Popup content function
function createPopupContent(marker) {
  return `
    <div class="custom-popup">
      ${marker.crafting || marker.quests ? `
        <div class="popup-buttons">
          ${marker.crafting ? `<div class="popup-button crafting-button">C</div>` : ''}
          ${marker.quests ? `<div class="popup-button quests-button">Q</div>` : ''}
        </div>
      ` : ''}
      
      <div class="popup-header">
        ${marker.image ? `<img src="${marker.image}" class="popup-icon"/>` : ''}
        <div class="popup-title">
          <h3 class="popup-name">${marker.name}</h3>
          ${marker.type ? `<p class="popup-type">${marker.type}</p>` : ''}
          ${marker.rarity ? `<p class="popup-rarity rarity-${marker.rarity}">${marker.rarity}</p>` : ''}
        </div>
      </div>
      
      <div class="popup-body">
        ${marker.location ? `<p class="popup-location">${marker.location}</p>` : ''}
        ${marker.notes?.length ? `
          <div class="popup-notes">
            ${marker.notes.map(note => `<p>${note}</p>`).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Load and create markers
fetch('./data/markerData.json')
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  })
  .then(data => {
    if (!Array.isArray(data)) throw new Error('Marker data is not an array');
    
    data.forEach(marker => {
      if (!layerGroups[marker.type]) {
        console.error(`Unknown layer type: ${marker.type}`);
        return;
      }

      const markerObj = L.marker(
        [marker.coords[0], [marker.coords[1]],
        { icon: createCustomIcon(marker) }
      ).addTo(layerGroups[marker.type]);

      markerObj.bindPopup(createPopupContent(marker), {
        className: 'custom-popup-wrapper',
        maxWidth: 350
      });

      markerObj.on('popupopen', () => {
        // Button handlers...
      });
    });
  })
  .catch(error => {
    console.error('Error loading markers:', error);
  });

// Layer toggle functionality
document.querySelectorAll('.toggle-group input').forEach(toggle => {
  toggle.addEventListener('change', (e) => {
    const layer = e.target.dataset.layer;
    if (layerGroups[layer]) {
      e.target.checked ? 
        map.addLayer(layerGroups[layer]) : 
        map.removeLayer(layerGroups[layer]);
    }
  });
});

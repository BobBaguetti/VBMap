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

// Initialize layer groups
const layers = {
  teleports: L.layerGroup(),
  extracts: L.layerGroup(),
  items: L.layerGroup()
};

// Add layers to map
Object.values(layers).forEach(layer => layer.addTo(map));

// Custom icon creation function
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

// Enhanced popup creation function
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
          ${marker.subtype ? `<p class="popup-type">${marker.subtype}</p>` : ''}
          ${marker.rarity ? `<p class="popup-rarity rarity-${marker.rarity}">${marker.rarity}</p>` : ''}
        </div>
      </div>
      
      <div class="popup-body">
        ${marker.location ? `<p class="popup-location">${marker.location}</p>` : ''}
        ${marker.notes && marker.notes.length ? `
          <div class="popup-notes">
            ${marker.notes.map(note => `<p>${note}</p>`).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Load markers from JSON
fetch('./data/markerData.json')
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  })
  .then(data => {
    if (!Array.isArray(data)) throw new Error('Marker data is not an array');
    
    data.forEach(marker => {
      if (!marker.type || !layers[marker.type]) {
        console.error(`Invalid marker type: ${marker.type}`);
        return;
      }

      const markerObj = L.marker(
        [marker.coords[0], marker.coords[1]],
        { icon: createCustomIcon(marker) }
      ).addTo(layers[marker.type]);

      markerObj.bindPopup(createPopupContent(marker), {
        className: 'custom-popup-wrapper',
        maxWidth: 350
      });

      markerObj.on('popupopen', () => {
        if (marker.crafting) {
          document.querySelector('.crafting-button')?.addEventListener('click', () => {
            console.log("Crafting recipes for:", marker.name);
          });
        }
        
        if (marker.quests) {
          document.querySelector('.quests-button')?.addEventListener('click', () => {
            console.log("Quest requirements for:", marker.name);
          });
        }

        document.querySelectorAll('.location-link').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Location clicked:", e.target.textContent);
          });
        });
      });
    });
  })
  .catch(error => {
    console.error("Error loading markers:", error);
  });

// Layer toggles
document.querySelectorAll('.toggle-group input').forEach(toggle => {
  toggle.addEventListener('change', (e) => {
    const layer = e.target.dataset.layer;
    if (layers[layer]) {
      e.target.checked ? 
        map.addLayer(layers[layer]) : 
        map.removeLayer(layers[layer]);
    }
  });
});

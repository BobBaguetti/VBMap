console.log("Script loaded!");

// Initialize Map
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -2,
  maxZoom: 4
});

// Set map bounds
const bounds = [[0, 0], [3000, 3000]];
const imageUrl = './media/images/tempmap.png';
L.imageOverlay(imageUrl, bounds).addTo(map);
map.fitBounds(bounds);

// Create layer groups – clustering the "items" layer
const layers = {
  teleports: L.layerGroup(),
  extracts: L.layerGroup(),
  items: L.markerClusterGroup()
};

// Add layers to map
Object.values(layers).forEach(layer => layer.addTo(map));

// Global array for marker search functionality
let allMarkers = [];

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
        ${marker.description ? `<p>${marker.description}</p>` : ''}
        ${marker.usage ? `<p><em>${marker.usage}</em></p>` : ''}
        <button class="more-info-btn">More Info</button>
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
      );
      markerObj.bindPopup(createPopupContent(marker), {
        className: 'custom-popup-wrapper',
        maxWidth: 350
      });
      layers[marker.type].addLayer(markerObj);
      
      // Save marker for search functionality
      allMarkers.push({ markerObj, data: marker });
      
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
        
        document.querySelector('.more-info-btn')?.addEventListener('click', () => {
          alert(`More details about ${marker.name}:\n\n${marker.description || 'No additional info.'}`);
        });
      });
    });
  })
  .catch(error => {
    console.error("Error loading markers:", error);
  });

// Sidebar toggle using class toggle to collapse entirely
document.getElementById('sidebar-toggle').addEventListener('click', function() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('hidden');
  
  // Adjust the map container margin accordingly
  const mapDiv = document.getElementById('map');
  if (sidebar.classList.contains('hidden')) {
    mapDiv.style.marginLeft = '0';
  } else {
    mapDiv.style.marginLeft = '300px';
  }
  
  // Invalidate map size so Leaflet properly redraws the map
  map.invalidateSize();
});

// Basic search functionality (filter markers by name)
document.getElementById('search-bar').addEventListener('input', function() {
  const query = this.value.toLowerCase();
  allMarkers.forEach(item => {
    const markerName = item.data.name.toLowerCase();
    if (markerName.includes(query)) {
      if (!map.hasLayer(item.markerObj)) {
        layers[item.data.type].addLayer(item.markerObj);
      }
    } else {
      layers[item.data.type].removeLayer(item.markerObj);
    }
  });
});

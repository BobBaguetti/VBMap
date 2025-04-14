console.log("Script loaded!");

// Initialize Map (disable default zoom control)
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -2,
  maxZoom: 4,
  zoomControl: false
});

// Add custom zoom control on the top right
L.control.zoom({ position: 'topright' }).addTo(map);

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

/* -----------------------------------------------------------
   Utility Functions: Context Menu
------------------------------------------------------------*/
// Create a context menu element (appended to <body>)
const contextMenu = document.createElement('div');
contextMenu.id = 'context-menu';
document.body.appendChild(contextMenu);
contextMenu.style.position = 'absolute';
contextMenu.style.background = '#fff';
contextMenu.style.border = '1px solid #ccc';
contextMenu.style.padding = '5px';
contextMenu.style.display = 'none';
contextMenu.style.zIndex = '2000';
contextMenu.style.boxShadow = '0px 2px 6px rgba(0,0,0,0.3)';

function showContextMenu(x, y, options) {
  contextMenu.innerHTML = ''; // Clear previous content
  options.forEach(option => {
    let menuItem = document.createElement('div');
    menuItem.innerText = option.text;
    // Basic menu item styling
    menuItem.style.padding = '5px 10px';
    menuItem.style.cursor = 'pointer';
    menuItem.style.whiteSpace = 'nowrap';
    menuItem.addEventListener('click', () => {
      option.action();
      contextMenu.style.display = 'none';
    });
    contextMenu.appendChild(menuItem);
  });
  contextMenu.style.left = x + 'px';
  contextMenu.style.top = y + 'px';
  contextMenu.style.display = 'block';
}

// Hide context menu on any click elsewhere
document.addEventListener('click', () => {
  contextMenu.style.display = 'none';
});

/* -----------------------------------------------------------
   Utility Function: Add Marker
------------------------------------------------------------*/
function addMarker(markerData) {
  // Create marker with optional drag disabled initially
  const markerObj = L.marker(
    [markerData.coords[0], markerData.coords[1]],
    { icon: createCustomIcon(markerData), draggable: false }
  );
  markerObj.bindPopup(createPopupContent(markerData), {
    className: 'custom-popup-wrapper',
    maxWidth: 350
  });
  layers[markerData.type].addLayer(markerObj);

  // Save marker for search functionality
  allMarkers.push({ markerObj: markerObj, data: markerData });

  // Attach contextmenu event on the marker for editing options
  markerObj.on('contextmenu', function(e) {
    e.originalEvent.preventDefault();
    // Show context menu with options for this marker
    showContextMenu(e.originalEvent.pageX, e.originalEvent.pageY, [
      {
        text: 'Edit Marker',
        action: function() {
          const newName = prompt("Enter new marker name:", markerData.name);
          if (newName) {
            markerData.name = newName;
            markerObj.setPopupContent(createPopupContent(markerData));
          }
        }
      },
      {
        text: 'Duplicate Marker',
        action: function() {
          // Create a copy of the marker data and add to map
          let duplicate = Object.assign({}, markerData);
          duplicate.name = markerData.name + " (copy)";
          addMarker(duplicate);
        }
      },
      {
        text: 'Enable Drag',
        action: function() {
          markerObj.dragging.enable();
          alert("Marker is now draggable. Drag it to a new location.");
          // Optionally, you could add a "Disable Drag" option later.
        }
      }
    ]);
  });
}

/* -----------------------------------------------------------
   Custom Icon & Popup Creation Functions
------------------------------------------------------------*/
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

/* -----------------------------------------------------------
   Load Markers from JSON Data
------------------------------------------------------------*/
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
      addMarker(marker);
    });
  })
  .catch(error => {
    console.error("Error loading markers:", error);
  });

/* -----------------------------------------------------------
   Right-Click on Map to Create New Marker
------------------------------------------------------------*/
map.on('contextmenu', function(e) {
  // When right-clicking on the map (not on an existing marker),
  // show a menu to create a new marker.
  showContextMenu(e.originalEvent.pageX, e.originalEvent.pageY, [
    {
      text: 'Create New Marker',
      action: function() {
        const markerName = prompt("Enter new marker name:");
        if (markerName) {
          const newMarker = {
            type: 'items', // Default type; adjust as needed
            name: markerName,
            coords: [e.latlng.lat, e.latlng.lng],
            image: '',  // Optionally prompt or leave blank
            location: '',
            notes: []
          };
          addMarker(newMarker);
        }
      }
    }
  ]);
});

/* -----------------------------------------------------------
   Sidebar Toggle (Slide Off-screen) & Map Margin Adjustment
------------------------------------------------------------*/
document.getElementById('sidebar-toggle').addEventListener('click', function() {
  const sidebar = document.getElementById('sidebar');
  const mapDiv = document.getElementById('map');
  sidebar.classList.toggle('hidden');
  
  if (sidebar.classList.contains('hidden')) {
    mapDiv.style.marginLeft = '0';
  } else {
    mapDiv.style.marginLeft = '300px';
  }
  
  map.invalidateSize();
});

/* -----------------------------------------------------------
   Basic Search Functionality (Filter Markers by Name)
------------------------------------------------------------*/
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

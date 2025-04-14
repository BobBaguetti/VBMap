// Initialize Map with your map.png
const map = L.map('map-admin').setView([1500, 1500], 2);
L.imageOverlay('../docs/media/images/map.png', [[0, 0], [3000, 3000]]).addTo(map);

// State Management
let markers = [];
let tempMarker = null;

// Load Markers
function loadMarkers() {
  fetch('../docs/data/markerData.json')
    .then(response => response.json())
    .then(data => {
      markers = data;
      renderMarkerList();
    })
    .catch(error => console.error('Error loading markers:', error));
}

// Right-Click Handler
map.on('contextmenu', (e) => {
  if (tempMarker) map.removeLayer(tempMarker);
  
  tempMarker = L.marker(e.latlng, {
    draggable: true,
    icon: L.divIcon({ className: 'temp-marker' })
  }).addTo(map);
  
  resetForm();
  showMarkerForm();
});

// Form Controls
function showMarkerForm() {
  document.getElementById('marker-form').style.display = 'block';
  document.getElementById('marker-list').style.display = 'none';
}

function hideMarkerForm() {
  document.getElementById('marker-form').style.display = 'none';
  document.getElementById('marker-list').style.display = 'block';
  if (tempMarker) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }
}

function resetForm() {
  document.getElementById('marker-type').value = 'item';
  updateDynamicFields('item');
  document.querySelectorAll('#dynamic-fields input, #dynamic-fields textarea').forEach(el => {
    el.value = '';
  });
}

// Dynamic Form Fields
function updateDynamicFields(type) {
  const fields = {
    item: `
      <div class="form-group">
        <label>Item Name</label>
        <input type="text" id="marker-name" placeholder="e.g. Iron Ore">
      </div>
      <div class="form-group">
        <label>Image</label>
        <select id="marker-image" class="js-select">
          <option value="iron_ore.png">Iron Ore</option>
          <!-- Add more item images as options -->
        </select>
      </div>
      <div class="form-group">
        <label>Rarity</label>
        <select id="marker-rarity" class="js-select">
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
        </select>
      </div>
    `,
    teleport: `
      <div class="form-group">
        <label>Teleport Name</label>
        <input type="text" id="marker-name" placeholder="e.g. Central Hub">
      </div>
      <div class="form-group">
        <label>Linked Location</label>
        <input type="text" id="marker-link" placeholder="e.g. North District">
      </div>
    `,
    extraction: `
      <div class="form-group">
        <label>Extraction Name</label>
        <input type="text" id="marker-name" placeholder="e.g. Sewer Exit">
      </div>
      <div class="form-group">
        <label>Requirements</label>
        <textarea id="marker-requirements" rows="2"></textarea>
      </div>
    `
  };
  
  document.getElementById('dynamic-fields').innerHTML = fields[type] || '';
  $('.js-select').select2();
}

// Save Marker
document.getElementById('save-marker').addEventListener('click', () => {
  const markerData = {
    id: Date.now().toString(),
    type: document.getElementById('marker-type').value,
    name: document.getElementById('marker-name').value,
    coords: [tempMarker.getLatLng().lat, tempMarker.getLatLng().lng],
    image: document.getElementById('marker-image')?.value || '',
    rarity: document.getElementById('marker-rarity')?.value || '',
    timestamp: new Date().toISOString()
  };
  
  markers.push(markerData);
  saveMarkers();
  renderMarkerList();
  hideMarkerForm();
});

// Save to JSON
function saveMarkers() {
  fetch('http://localhost:3000/api/save-markers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(markers)
  }).then(() => console.log('Markers saved'));
}

// Render Marker List
function renderMarkerList() {
  const container = document.getElementById('marker-items');
  container.innerHTML = '';
  
  markers.forEach(marker => {
    const item = document.createElement('div');
    item.className = 'marker-item';
    item.innerHTML = `
      <strong>${marker.name}</strong>
      <div>${marker.type} (${marker.coords[0].toFixed(2)}, ${marker.coords[1].toFixed(2)})</div>
    `;
    item.addEventListener('click', () => {
      map.flyTo([marker.coords[0], marker.coords[1]], 15);
    });
    container.appendChild(item);
  });
}

// Initialize
$(document).ready(() => {
  $('.js-select').select2();
  loadMarkers();
  
  // Type change listener
  document.getElementById('marker-type').addEventListener('change', (e) => {
    updateDynamicFields(e.target.value);
  });
  
  // Cancel button
  document.getElementById('cancel-marker').addEventListener('click', hideMarkerForm);
});
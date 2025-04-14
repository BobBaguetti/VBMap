// Initialize Map
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('./images/map.png').addTo(map);

// State Management
let markers = [];
let tempMarker = null;
let currentMarker = null;

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
        <input type="text" id="marker-name" placeholder="e.g. Rusted Key">
      </div>
      <div class="form-group">
        <label>Rarity</label>
        <select id="marker-rarity" class="js-select">
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
        </select>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="marker-desc" rows="3"></textarea>
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
  $('.js-select').select2(); // Reinitialize Select2
}

// Save Marker
document.getElementById('save-marker').addEventListener('click', () => {
  const markerData = {
    id: Date.now().toString(),
    type: document.getElementById('marker-type').value,
    name: document.getElementById('marker-name').value,
    coords: [tempMarker.getLatLng().lat, tempMarker.getLatLng().lng],
    // Additional fields based on type:
    ...(document.getElementById('marker-rarity') && { 
      rarity: document.getElementById('marker-rarity').value 
    },
    ...(document.getElementById('marker-desc') && { 
      description: document.getElementById('marker-desc').value 
    }
  };
  
  markers.push(markerData);
  saveToDatabase(markerData);
  renderMarkerList();
  hideMarkerForm();
});

// Cancel Button
document.getElementById('cancel-marker').addEventListener('click', hideMarkerForm);

// Type Change Listener
document.getElementById('marker-type').addEventListener('change', (e) => {
  updateDynamicFields(e.target.value);
});

// Initialize
$(document).ready(() => {
  $('.js-select').select2();
  loadMarkers();
});

// Database Functions
function loadMarkers() {
  fetch('/data/markers.json')
    .then(response => response.json())
    .then(data => {
      markers = data;
      renderMarkerList();
    });
}

function saveToDatabase(marker) {
  fetch('/api/save-markers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(marker)
  });
}

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
      map.flyTo(marker.coords, 15);
    });
    container.appendChild(item);
  });
}

console.log("Script loaded!");

// ------------------------------
// Firebase Firestore Initialization
// ------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDwEdPK3UdPN5MB8YAuM_jb0K1iXfQ-tGQ",
  authDomain: "vbmap-cc834.firebaseapp.com",
  projectId: "vbmap-cc834",
  storageBucket: "vbmap-cc834.firebasestorage.app",
  messagingSenderId: "244112699360",
  appId: "1:244112699360:web:95f50adb6e10b438238585",
  measurementId: "G-7FDNWLRM95"
};
// Initialize Firebase (using compat version)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ------------------------------
// Map Initialization and Layers
// ------------------------------
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -2,
  maxZoom: 4,
  zoomControl: false  // disable default zoom control
});
L.control.zoom({ position: 'topright' }).addTo(map);  // add custom zoom control

const bounds = [[0, 0], [3000, 3000]];
const imageUrl = './media/images/tempmap.png';
L.imageOverlay(imageUrl, bounds).addTo(map);
map.fitBounds(bounds);

// Layer groups – note that the "items" layer uses marker clustering
const layers = {
  teleports: L.layerGroup(),
  extracts: L.layerGroup(),
  items: L.markerClusterGroup()
};
Object.values(layers).forEach(layer => layer.addTo(map));

// Global array for search functionality and editing reference
let allMarkers = [];

// ------------------------------
// Utility: Custom Context Menu
// ------------------------------
const contextMenu = document.createElement('div');
contextMenu.id = 'context-menu';
document.body.appendChild(contextMenu);
Object.assign(contextMenu.style, {
  position: 'absolute',
  background: '#fff',
  border: '1px solid #ccc',
  padding: '5px',
  display: 'none',
  zIndex: '2000',
  boxShadow: '0px 2px 6px rgba(0,0,0,0.3)'
});

function showContextMenu(x, y, options) {
  contextMenu.innerHTML = ''; // Clear previous contents
  options.forEach(option => {
    const menuItem = document.createElement('div');
    menuItem.innerText = option.text;
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

document.addEventListener('click', () => {
  contextMenu.style.display = 'none';
});

// ------------------------------
// Utility: Custom Edit Modal
// ------------------------------
// Assuming an edit modal exists in the HTML with id "edit-modal".
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editNameInput = document.getElementById('edit-name');
const editTypeSelect = document.getElementById('edit-type');
const editDescription = document.getElementById('edit-description');
let currentEditMarker = null; // To store marker reference for editing

// Hide modal function
function hideEditModal() {
  editModal.style.display = 'none';
  currentEditMarker = null;
}

// Handle form submission
editForm.addEventListener('submit', function(e) {
  e.preventDefault();
  if (!currentEditMarker) return;
  // Update marker data with values from form
  const updatedData = currentEditMarker.data;
  updatedData.name = editNameInput.value;
  updatedData.type = editTypeSelect.value;
  updatedData.description = editDescription.value;
  // Update popup content on the marker
  currentEditMarker.markerObj.setPopupContent(createPopupContent(updatedData));
  // Save updated marker in Firestore
  updateMarkerInFirestore(updatedData);
  hideEditModal();
});

// Cancel button
document.getElementById('edit-cancel').addEventListener('click', hideEditModal);

// ------------------------------
// Firebase: Update Marker Function
// ------------------------------
function updateMarkerInFirestore(markerData) {
  if (markerData.id) {
    db.collection("markers").doc(markerData.id).set(markerData)
      .then(() => { console.log("Marker updated successfully"); })
      .catch(error => { console.error("Error updating marker:", error); });
  } else {
    db.collection("markers").add(markerData)
      .then(docRef => {
        markerData.id = docRef.id;
        console.log("Marker added with ID:", docRef.id);
      })
      .catch(error => { console.error("Error adding marker:", error); });
  }
}

// ------------------------------
// Utility: Add Marker Function
// ------------------------------
function addMarker(markerData) {
  const markerObj = L.marker(
    [markerData.coords[0], markerData.coords[1]],
    { icon: createCustomIcon(markerData), draggable: false }
  );
  markerObj.bindPopup(createPopupContent(markerData), {
    className: 'custom-popup-wrapper',
    maxWidth: 350
  });
  layers[markerData.type].addLayer(markerObj);
  allMarkers.push({ markerObj, data: markerData });
  
  // Attach custom context menu on right-click for marker editing
  markerObj.on('contextmenu', function(e) {
    e.originalEvent.preventDefault();
    showContextMenu(e.originalEvent.pageX, e.originalEvent.pageY, [
      {
        text: 'Edit Marker',
        action: function() {
          // Open custom edit modal next to the cursor
          currentEditMarker = { markerObj, data: markerData };
          editNameInput.value = markerData.name || "";
          editTypeSelect.value = markerData.type || "items";
          editDescription.value = markerData.description || "";
          // Position the modal (for example, near the cursor)
          editModal.style.left = e.originalEvent.pageX + 10 + "px";
          editModal.style.top = e.originalEvent.pageY + 10 + "px";
          editModal.style.display = 'block';
        }
      },
      {
        text: 'Duplicate Marker',
        action: function() {
          const duplicate = Object.assign({}, markerData);
          duplicate.name = markerData.name + " (copy)";
          addMarker(duplicate);
          updateMarkerInFirestore(duplicate);
        }
      },
      {
        text: (markerObj.dragging.enabled() ? 'Disable Drag' : 'Enable Drag'),
        action: function() {
          if (markerObj.dragging.enabled()) {
            markerObj.dragging.disable();
          } else {
            markerObj.dragging.enable();
          }
          // Save new position when dragging stops (optional)
          markerObj.on('dragend', function() {
            const latlng = markerObj.getLatLng();
            markerData.coords = [latlng.lat, latlng.lng];
            updateMarkerInFirestore(markerData);
          });
        }
      }
    ]);
  });
}

// ------------------------------
// Custom Icon & Popup Creation Functions
// ------------------------------
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

// ------------------------------
// Load Markers from Firestore (or fallback to JSON)
// ------------------------------
function loadMarkers() {
  db.collection("markers").get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        const markerData = doc.data();
        markerData.id = doc.id;
        if (!markerData.type || !layers[markerData.type]) {
          console.error(`Invalid marker type: ${markerData.type}`);
          return;
        }
        addMarker(markerData);
      });
    })
    .catch(error => {
      console.error("Error loading markers from Firestore:", error);
      // Fallback to local JSON if needed:
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
        .catch(err => console.error("Error loading markers from JSON:", err));
    });
}
loadMarkers();

// ------------------------------
// Right-Click on Map to Create New Marker
// ------------------------------
map.on('contextmenu', function(e) {
  // If right-click on map (not marker), show menu to create a new marker.
  showContextMenu(e.originalEvent.pageX, e.originalEvent.pageY, [
    {
      text: 'Create New Marker',
      action: function() {
        // Instead of using prompt(), open the edit modal with empty fields.
        currentEditMarker = null;  // New marker mode.
        // Pre-fill with default values:
        editNameInput.value = "";
        editTypeSelect.value = "items";
        editDescription.value = "";
        // Position the modal near the click:
        editModal.style.left = e.originalEvent.pageX + 10 + "px";
        editModal.style.top = e.originalEvent.pageY + 10 + "px";
        editModal.style.display = 'block';
        // When the form is submitted, create a new marker at the clicked position.
        editForm.onsubmit = function(ev) {
          ev.preventDefault();
          const newMarker = {
            type: editTypeSelect.value,
            name: editNameInput.value || "New Marker",
            coords: [e.latlng.lat, e.latlng.lng],
            image: "",
            description: editDescription.value,
            location: "",
            notes: []
          };
          addMarker(newMarker);
          updateMarkerInFirestore(newMarker);
          hideEditModal();
          // Reset the form submission handler back to default.
          editForm.onsubmit = null;
        };
      }
    }
  ]);
});

// ------------------------------
// Sidebar Toggle (Slide Off-Screen) & Map Margin Adjustment
// ------------------------------
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

// ------------------------------
// Basic Search Functionality (Filter Markers by Name)
// ------------------------------
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

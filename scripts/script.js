console.log("Script loaded!");

// ------------------------------
// Detect Admin Mode (via URL parameter ?admin=true)
const isAdmin = window.location.search.includes("admin=true");

// ------------------------------
// Firebase Firestore Initialization (compat)
const firebaseConfig = {
  apiKey: "AIzaSyDwEdPK3UdPN5MB8YAuM_jb0K1iXfQ-tGQ",
  authDomain: "vbmap-cc834.firebaseapp.com",
  projectId: "vbmap-cc834",
  storageBucket: "vbmap-cc834.firebasestorage.app",
  messagingSenderId: "244112699360",
  appId: "1:244112699360:web:95f50adb6e10b438238585",
  measurementId: "G-7FDNWLRM95"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ------------------------------
// Map Initialization & Layer Setup
const map = L.map("map", {
  crs: L.CRS.Simple,
  minZoom: -2,
  maxZoom: 4,
  zoomControl: false
});
L.control.zoom({ position: "topright" }).addTo(map);

const bounds = [
  [0, 0],
  [3000, 3000]
];
const imageUrl = "./media/images/tempmap.png";
L.imageOverlay(imageUrl, bounds).addTo(map);
map.fitBounds(bounds);

// Create layer groups – clustering the "items" layer
const layers = {
  teleports: L.layerGroup(),
  extracts: L.layerGroup(),
  items: L.markerClusterGroup()
};
Object.values(layers).forEach(layer => layer.addTo(map));

// Global array to hold markers (for search and editing)
let allMarkers = [];

// ------------------------------
// Utility: Custom Context Menu (for admin mode only)
const contextMenu = document.createElement("div");
contextMenu.id = "context-menu";
document.body.appendChild(contextMenu);
Object.assign(contextMenu.style, {
  position: "absolute",
  background: "#fff",
  border: "1px solid #ccc",
  padding: "5px",
  display: "none",
  zIndex: "2000",
  boxShadow: "0px 2px 6px rgba(0,0,0,0.3)"
});

function showContextMenu(x, y, options) {
  contextMenu.innerHTML = "";
  options.forEach(option => {
    const menuItem = document.createElement("div");
    menuItem.innerText = option.text;
    menuItem.style.padding = "5px 10px";
    menuItem.style.cursor = "pointer";
    menuItem.style.whiteSpace = "nowrap";
    menuItem.addEventListener("click", () => {
      option.action();
      contextMenu.style.display = "none";
    });
    contextMenu.appendChild(menuItem);
  });
  contextMenu.style.left = x + "px";
  contextMenu.style.top = y + "px";
  contextMenu.style.display = "block";
}
if (isAdmin) {
  document.addEventListener("click", () => {
    contextMenu.style.display = "none";
  });
}

// ------------------------------
// Utility: Custom Edit Modal (for marker editing)
// Get references to modal elements
const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const editNameInput = document.getElementById("edit-name");
const editTypeSelect = document.getElementById("edit-type");
const editDescription = document.getElementById("edit-description");
let currentEditMarker = null;

function hideEditModal() {
  editModal.style.display = "none";
  currentEditMarker = null;
}
editForm.addEventListener("submit", function (e) {
  e.preventDefault();
  if (!currentEditMarker) return;
  // Update marker data from form inputs
  const updatedData = currentEditMarker.data;
  updatedData.name = editNameInput.value;
  updatedData.type = editTypeSelect.value;
  updatedData.description = editDescription.value;
  // Update marker popup content
  currentEditMarker.markerObj.setPopupContent(createPopupContent(updatedData));
  // Save updated marker to Firestore
  updateMarkerInFirestore(updatedData);
  hideEditModal();
});
document.getElementById("edit-cancel").addEventListener("click", hideEditModal);

// ------------------------------
// Firebase: Save/Update Marker Data
function updateMarkerInFirestore(markerData) {
  if (markerData.id) {
    db.collection("markers")
      .doc(markerData.id)
      .set(markerData)
      .then(() => {
        console.log("Marker updated successfully");
      })
      .catch(error => {
        console.error("Error updating marker:", error);
      });
  } else {
    db.collection("markers")
      .add(markerData)
      .then(docRef => {
        markerData.id = docRef.id;
        console.log("Marker added with ID:", docRef.id);
      })
      .catch(error => {
        console.error("Error adding marker:", error);
      });
  }
}

// ------------------------------
// Utility: Create Marker Functions
function createCustomIcon(marker) {
  return L.divIcon({
    html: `
      <div class="custom-marker">
        <div class="marker-border"></div>
        ${marker.image ? `<img src="${marker.image}" class="marker-icon"/>` : ""}
      </div>
    `,
    className: "custom-marker-container",
    iconSize: [32, 32]
  });
}

function createPopupContent(marker) {
  return `
    <div class="custom-popup">
      ${marker.crafting || marker.quests ? `
        <div class="popup-buttons">
          ${marker.crafting ? `<div class="popup-button crafting-button">C</div>` : ""}
          ${marker.quests ? `<div class="popup-button quests-button">Q</div>` : ""}
        </div>
      ` : ""}
      <div class="popup-header">
        ${marker.image ? `<img src="${marker.image}" class="popup-icon"/>` : ""}
        <div class="popup-title">
          <h3 class="popup-name">${marker.name}</h3>
          ${marker.subtype ? `<p class="popup-type">${marker.subtype}</p>` : ""}
          ${marker.rarity ? `<p class="popup-rarity rarity-${marker.rarity}">${marker.rarity}</p>` : ""}
        </div>
      </div>
      <div class="popup-body">
        ${marker.location ? `<p class="popup-location">${marker.location}</p>` : ""}
        ${marker.notes && marker.notes.length ? `
          <div class="popup-notes">
            ${marker.notes.map(note => `<p>${note}</p>`).join("")}
          </div>
        ` : ""}
        ${marker.description ? `<p>${marker.description}</p>` : ""}
        ${marker.usage ? `<p><em>${marker.usage}</em></p>` : ""}
        <button class="more-info-btn">More Info</button>
      </div>
    </div>
  `;
}

// ------------------------------
// Add Marker Utility Function
function addMarker(markerData) {
  const markerObj = L.marker(
    [markerData.coords[0], markerData.coords[1]],
    { icon: createCustomIcon(markerData), draggable: false }
  );
  markerObj.bindPopup(createPopupContent(markerData), {
    className: "custom-popup-wrapper",
    maxWidth: 350
  });
  layers[markerData.type].addLayer(markerObj);
  allMarkers.push({ markerObj, data: markerData });
  
  // If in admin mode, attach context menu for editing
  if (isAdmin) {
    markerObj.on("contextmenu", function (e) {
      e.originalEvent.preventDefault();
      showContextMenu(e.originalEvent.pageX, e.originalEvent.pageY, [
        {
          text: "Edit Marker",
          action: function () {
            // Populate the edit modal with current marker data and show it
            currentEditMarker = { markerObj, data: markerData };
            editNameInput.value = markerData.name || "";
            editTypeSelect.value = markerData.type || "items";
            editDescription.value = markerData.description || "";
            // Position modal near the click
            editModal.style.left = e.originalEvent.pageX + 10 + "px";
            editModal.style.top = e.originalEvent.pageY + 10 + "px";
            editModal.style.display = "block";
          }
        },
        {
          text: "Duplicate Marker",
          action: function () {
            const duplicate = Object.assign({}, markerData);
            duplicate.name = markerData.name + " (copy)";
            addMarker(duplicate);
            updateMarkerInFirestore(duplicate);
          }
        },
        {
          text: markerObj.dragging.enabled() ? "Disable Drag" : "Enable Drag",
          action: function () {
            if (markerObj.dragging.enabled()) {
              markerObj.dragging.disable();
            } else {
              markerObj.dragging.enable();
              markerObj.on("dragend", function () {
                const latlng = markerObj.getLatLng();
                markerData.coords = [latlng.lat, latlng.lng];
                updateMarkerInFirestore(markerData);
              });
            }
          }
        }
      ]);
    });
  }
}

// ------------------------------
// Load Markers (from Firestore with JSON fallback)
function loadMarkers() {
  db.collection("markers")
    .get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        let markerData = doc.data();
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
      // Fallback: load from local JSON file
      fetch("./data/markerData.json")
        .then(response => {
          if (!response.ok) throw new Error("Network response was not ok");
          return response.json();
        })
        .then(data => {
          if (!Array.isArray(data)) throw new Error("Marker data is not an array");
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
// Right-Click on Map to Create New Marker (Admin Only)
if (isAdmin) {
  map.on("contextmenu", function (e) {
    showContextMenu(e.originalEvent.pageX, e.originalEvent.pageY, [
      {
        text: "Create New Marker",
        action: function () {
          // Open edit modal in "new marker" mode with empty fields
          currentEditMarker = null;
          editNameInput.value = "";
          editTypeSelect.value = "items";
          editDescription.value = "";
          // Position modal near the click
          editModal.style.left = e.originalEvent.pageX + 10 + "px";
          editModal.style.top = e.originalEvent.pageY + 10 + "px";
          editModal.style.display = "block";
          // On form submit, create a new marker at the clicked location
          editForm.onsubmit = function (ev) {
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
            // Reset onsubmit after creation
            editForm.onsubmit = null;
          };
        }
      }
    ]);
  });
}

// ------------------------------
// Sidebar Toggle (Slide Off-Screen) & Map Margin Adjustment
document.getElementById("sidebar-toggle").addEventListener("click", function () {
  const sidebar = document.getElementById("sidebar");
  const mapDiv = document.getElementById("map");
  sidebar.classList.toggle("hidden");
  mapDiv.style.marginLeft = sidebar.classList.contains("hidden") ? "0" : "300px";
  map.invalidateSize();
});

// ------------------------------
// Basic Search Functionality (Filter Markers by Name)
document.getElementById("search-bar").addEventListener("input", function () {
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

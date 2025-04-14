document.addEventListener("DOMContentLoaded", () => {
  console.log("Script loaded!");

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

  // Create display names mapping for marker types
  const markerTypeDisplay = {
    "Item": "Item",
    "Teleport": "Teleport",
    "Extraction Portal": "Extraction Portal",
    "Door": "Door"
  };

  // Layer groups: note the "Item" group may be either a marker cluster or a layer group.
  let itemLayer = L.markerClusterGroup(); // default clustering enabled
  const layers = {
    "Teleport": L.layerGroup(),
    "Extraction Portal": L.layerGroup(),
    "Item": itemLayer,
    "Door": L.layerGroup()
  };
  Object.values(layers).forEach(layer => layer.addTo(map));

  // Global array to hold markers for search/editing
  let allMarkers = [];

  // ------------------------------
  // Utility: Custom Context Menu (Dark UI)
  const contextMenu = document.createElement("div");
  contextMenu.id = "context-menu";
  document.body.appendChild(contextMenu);
  Object.assign(contextMenu.style, {
    position: "absolute",
    background: "#333",
    color: "#eee",
    border: "1px solid #555",
    padding: "5px",
    display: "none",
    zIndex: "2000",
    boxShadow: "0px 2px 6px rgba(0,0,0,0.5)"
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
  document.addEventListener("click", () => {
    contextMenu.style.display = "none";
  });

  // ------------------------------
  // Utility: Custom Edit Modal (for marker editing)
  const editModal = document.getElementById("edit-modal");
  const editForm = document.getElementById("edit-form");
  const editNameInput = document.getElementById("edit-name");
  const editTypeSelect = document.getElementById("edit-type");
  const editDescription = document.getElementById("edit-description");
  const editRarity = document.getElementById("edit-rarity");         // may be null if not in modal
  const editItemType = document.getElementById("edit-item-type");      // may be null
  const editExtra1 = document.getElementById("edit-extra-1");          // optional fields
  const editExtra2 = document.getElementById("edit-extra-2");
  const editExtra3 = document.getElementById("edit-extra-3");
  const itemExtraFields = document.getElementById("item-extra-fields");
  let currentEditMarker = null;
  function hideEditModal() {
    editModal.style.display = "none";
    currentEditMarker = null;
    editForm.onsubmit = null;
  }
  editForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!currentEditMarker) return;
    const updatedData = currentEditMarker.data;
    updatedData.name = editNameInput.value;
    updatedData.type = editTypeSelect.value;
    updatedData.description = editDescription.value;
    // If type is Item, update extra fields:
    if (updatedData.type === "Item") {
      updatedData.rarity = document.getElementById("edit-rarity").value;
      updatedData.itemType = document.getElementById("edit-item-type").value;
      updatedData.extra1 = document.getElementById("edit-extra-1").value;
      updatedData.extra2 = document.getElementById("edit-extra-2").value;
      updatedData.extra3 = document.getElementById("edit-extra-3").value;
    } else {
      // Remove extra fields if not Item
      delete updatedData.rarity;
      delete updatedData.itemType;
      delete updatedData.extra1;
      delete updatedData.extra2;
      delete updatedData.extra3;
    }
    currentEditMarker.markerObj.setPopupContent(createPopupContent(updatedData));
    updateMarkerInFirestore(updatedData);
    hideEditModal();
  });
  document.getElementById("edit-cancel").addEventListener("click", hideEditModal);

  // Show/hide additional fields if type is "Item"
  editTypeSelect.addEventListener("change", function() {
    if (this.value === "Item") {
      document.getElementById("item-extra-fields").style.display = "block";
    } else {
      document.getElementById("item-extra-fields").style.display = "none";
    }
  });

  // ------------------------------
  // Firebase: Save/Update Marker Data
  function updateMarkerInFirestore(markerData) {
    if (markerData.id) {
      db.collection("markers")
        .doc(markerData.id)
        .set(markerData)
        .then(() => { console.log("Marker updated successfully"); })
        .catch(error => { console.error("Error updating marker:", error); });
    } else {
      db.collection("markers")
        .add(markerData)
        .then(docRef => {
          markerData.id = docRef.id;
          console.log("Marker added with ID:", docRef.id);
        })
        .catch(error => { console.error("Error adding marker:", error); });
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
    let extraContent = "";
    if (marker.type === "Item") {
      extraContent = `
        <p>Rarity: ${marker.rarity || "N/A"}</p>
        <p>Item Type: ${marker.itemType || "N/A"}</p>
        ${marker.extra1 ? `<p>Extra 1: ${marker.extra1}</p>` : ""}
        ${marker.extra2 ? `<p>Extra 2: ${marker.extra2}</p>` : ""}
        ${marker.extra3 ? `<p>Extra 3: ${marker.extra3}</p>` : ""}
      `;
    }
    return `
      <div class="custom-popup">
        <div class="popup-header">
          ${marker.image ? `<img src="${marker.image}" class="popup-icon"/>` : ""}
          <div class="popup-title">
            <h3 class="popup-name">${marker.name}</h3>
            ${marker.subtype ? `<p class="popup-type">${marker.subtype}</p>` : ""}
            ${marker.rarity && marker.type === "Item" ? `<p class="popup-rarity rarity-${marker.rarity}">${marker.rarity}</p>` : ""}
          </div>
        </div>
        <div class="popup-body">
          ${marker.location ? `<p class="popup-location">${marker.location}</p>` : ""}
          ${marker.description ? `<p>${marker.description}</p>` : ""}
          ${extraContent}
          ${marker.usage ? `<p><em>${marker.usage}</em></p>` : ""}
          <button class="more-info-btn">More Info</button>
        </div>
      </div>
    `;
  }

  // ------------------------------
  // Option: Toggle Marker Clustering (for Item layer)
  const disableGroupingCheckbox = document.getElementById("disable-grouping");
  disableGroupingCheckbox.addEventListener("change", function () {
    // Remove current item layer
    map.removeLayer(layers["Item"]);
    if (this.checked) {
      // If grouping disabled, create a standard layer group
      layers["Item"] = L.layerGroup();
    } else {
      // Else, use marker clustering
      layers["Item"] = L.markerClusterGroup();
    }
    // Re-add all item markers from global array that are of type "Item"
    allMarkers.forEach(item => {
      if (item.data.type === "Item") {
        layers["Item"].addLayer(item.markerObj);
      }
    });
    layers["Item"].addTo(map);
  });

  // ------------------------------
  // Utility: Add Marker
  function addMarker(markerData) {
    const markerObj = L.marker(
      [markerData.coords[0], markerData.coords[1]],
      { icon: createCustomIcon(markerData), draggable: false }
    );
    markerObj.bindPopup(createPopupContent(markerData), {
      className: "custom-popup-wrapper",
      maxWidth: 350
    });
    // Use the renamed marker type for layering (display names)
    layers[markerData.type].addLayer(markerObj);
    allMarkers.push({ markerObj, data: markerData });
    
    // Attach context menu for editing
    markerObj.on("contextmenu", function (e) {
      e.originalEvent.preventDefault();
      showContextMenu(e.originalEvent.pageX, e.originalEvent.pageY, [
        {
          text: "Edit Marker",
          action: function () {
            currentEditMarker = { markerObj, data: markerData };
            editNameInput.value = markerData.name || "";
            editTypeSelect.value = markerData.type || "Item";
            editDescription.value = markerData.description || "";
            // For Item markers, fill extra fields if they exist
            if (markerData.type === "Item") {
              document.getElementById("edit-rarity").value = markerData.rarity || "";
              document.getElementById("edit-item-type").value = markerData.itemType || "";
              document.getElementById("edit-extra-1").value = markerData.extra1 || "";
              document.getElementById("edit-extra-2").value = markerData.extra2 || "";
              document.getElementById("edit-extra-3").value = markerData.extra3 || "";
              document.getElementById("item-extra-fields").style.display = "block";
            } else {
              document.getElementById("item-extra-fields").style.display = "none";
            }
            // Position modal near the click
            editModal.style.left = e.originalEvent.pageX + 10 + "px";
            editModal.style.top = e.originalEvent.pageY + 10 + "px";
            editModal.style.display = "block";
          }
        },
        {
          text: "Duplicate Marker",
          action: function () {
            // Create duplicate marker; set duplicate to draggable (picked up state)
            const duplicate = Object.assign({}, markerData);
            duplicate.name = markerData.name + " (copy)";
            duplicate.coords = [...markerData.coords]; // same coordinates initially
            const newMarker = addMarker(duplicate);
            // Set the duplicate marker to be draggable immediately
            newMarker.dragging.enable();
            // Listen for a left-click on the map to drop it (once dropped, disable dragging and update coordinates)
            newMarker.on("dragend", function () {
              const latlng = newMarker.getLatLng();
              duplicate.coords = [latlng.lat, latlng.lng];
              updateMarkerInFirestore(duplicate);
              newMarker.dragging.disable();
            });
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
    return markerObj; // return markerObj so duplicate function can use it
  }

  // ------------------------------
  // Load Markers from Firestore with JSON Fallback
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
        // Fallback to local JSON if needed
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
  // Right-Click on Map to Create New Marker
  map.on("contextmenu", function (e) {
    showContextMenu(e.originalEvent.pageX, e.originalEvent.pageY, [
      {
        text: "Create New Marker",
        action: function () {
          // Open edit modal in "new marker" mode with blank fields
          currentEditMarker = null;
          editNameInput.value = "";
          editTypeSelect.value = "Item";
          editDescription.value = "";
          document.getElementById("item-extra-fields").style.display = "block";
          // Position modal near the click
          editModal.style.left = e.originalEvent.pageX + 10 + "px";
          editModal.style.top = e.originalEvent.pageY + 10 + "px";
          editModal.style.display = "block";
          // On form submit, create a new marker at the click location
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
            if (newMarker.type === "Item") {
              newMarker.rarity = document.getElementById("edit-rarity").value;
              newMarker.itemType = document.getElementById("edit-item-type").value;
              newMarker.extra1 = document.getElementById("edit-extra-1").value;
              newMarker.extra2 = document.getElementById("edit-extra-2").value;
              newMarker.extra3 = document.getElementById("edit-extra-3").value;
            }
            addMarker(newMarker);
            updateMarkerInFirestore(newMarker);
            hideEditModal();
            editForm.onsubmit = null;
          };
        }
      }
    ]);
  });

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
});

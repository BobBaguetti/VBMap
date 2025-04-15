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

  // Display names for marker types
  const markerTypeDisplay = {
    "Teleport": "Teleport",
    "Extraction Portal": "Extraction Portal",
    "Item": "Item",
    "Door": "Door"
  };

  // Layer groups: For Item markers, default is clustering.
  let itemLayer = L.markerClusterGroup();
  const layers = {
    "Teleport": L.layerGroup(),
    "Extraction Portal": L.layerGroup(),
    "Item": itemLayer,
    "Door": L.layerGroup()
  };
  Object.values(layers).forEach(layer => layer.addTo(map));

  // Global array to hold markers
  let allMarkers = [];

  // ------------------------------
  // Utility: Custom Context Menu (Dark Mode)
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
  // Utility: Make Edit Modal Draggable via Handle Only
  function makeModalDraggable(modal, handle) {
    let isDragging = false, offsetX, offsetY;
    handle.addEventListener("mousedown", (e) => {
      isDragging = true;
      const computedStyle = window.getComputedStyle(modal);
      offsetX = e.clientX - parseInt(computedStyle.left, 10);
      offsetY = e.clientY - parseInt(computedStyle.top, 10);
      e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        modal.style.left = (e.clientX - offsetX) + "px";
        modal.style.top = (e.clientY - offsetY) + "px";
      }
    });
    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }
  const editModal = document.getElementById("edit-modal");
  const editModalHandle = document.getElementById("edit-modal-handle");
  makeModalDraggable(editModal, editModalHandle);

  // ------------------------------
  // Utility: Video Popup for Previews
  const videoPopup = document.getElementById("video-popup");
  const videoPlayer = document.getElementById("video-player");
  const videoSource = document.getElementById("video-source");
  document.getElementById("video-close").addEventListener("click", () => {
    videoPopup.style.display = "none";
    videoPlayer.pause();
  });
  function openVideoPopup(x, y, videoURL) {
    videoSource.src = videoURL;
    videoPlayer.load();
    videoPopup.style.left = x + "px";
    videoPopup.style.top = y + "px";
    videoPopup.style.display = "block";
  }

  // ------------------------------
  // Utility: Custom Edit Modal (for marker editing)
  const editForm = document.getElementById("edit-form");
  const editNameInput = document.getElementById("edit-name");
  const editTypeSelect = document.getElementById("edit-type");
  const editImageSmall = document.getElementById("edit-image-small");
  const editImageBig = document.getElementById("edit-image-big");
  const editDescription = document.getElementById("edit-description");
  const itemExtraFields = document.getElementById("item-extra-fields");
  const editRarity = document.getElementById("edit-rarity");
  const editItemType = document.getElementById("edit-item-type");
  const editExtra1 = document.getElementById("edit-extra-1");
  const editExtra2 = document.getElementById("edit-extra-2");
  const editExtra3 = document.getElementById("edit-extra-3");
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
    updatedData.imageSmall = editImageSmall.value;
    updatedData.imageBig = editImageBig.value;
    updatedData.description = editDescription.value;
    if (updatedData.type === "Item") {
      updatedData.rarity = editRarity.value;
      updatedData.itemType = editItemType.value;
      updatedData.extra1 = editExtra1.value;
      updatedData.extra2 = editExtra2.value;
      updatedData.extra3 = editExtra3.value;
    } else {
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
  editTypeSelect.addEventListener("change", function () {
    if (this.value === "Item") {
      itemExtraFields.style.display = "block";
    } else {
      itemExtraFields.style.display = "none";
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
          ${marker.imageSmall ? `<img src="${marker.imageSmall}" class="marker-icon"/>` : ""}
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
    // If videoURL exists, add a button to play video
    let videoButton = "";
    if (marker.videoURL) {
      videoButton = `<button class="more-info-btn" onclick="openVideoPopup(event.clientX, event.clientY, '${marker.videoURL}')">Play Video</button>`;
    }
    return `
      <div class="custom-popup">
        <div class="popup-header">
          ${marker.imageBig ? `<img src="${marker.imageBig}" class="popup-icon"/>` : ""}
          <div class="popup-title">
            <h3 class="popup-name">${marker.name}</h3>
            ${marker.type === "Item" && marker.rarity ? `<p class="popup-rarity rarity-${marker.rarity}">${marker.rarity}</p>` : ""}
          </div>
        </div>
        <div class="popup-body">
          ${marker.description ? `<p>${marker.description}</p>` : ""}
          ${extraContent}
          ${marker.usage ? `<p><em>${marker.usage}</em></p>` : ""}
          ${videoButton}
        </div>
      </div>
    `;
  }

  // Expose openVideoPopup for inline onclick usage
  window.openVideoPopup = openVideoPopup;

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
    layers[markerData.type].addLayer(markerObj);
    allMarkers.push({ markerObj, data: markerData });
    
    markerObj.on("contextmenu", function (e) {
      e.originalEvent.preventDefault();
      showContextMenu(e.originalEvent.pageX, e.originalEvent.pageY, [
        {
          text: "Edit Marker",
          action: function () {
            currentEditMarker = { markerObj, data: markerData };
            editNameInput.value = markerData.name || "";
            editTypeSelect.value = markerData.type || "Item";
            editImageSmall.value = markerData.imageSmall || "";
            editImageBig.value = markerData.imageBig || "";
            editDescription.value = markerData.description || "";
            if (markerData.type === "Item") {
              document.getElementById("edit-rarity").value = markerData.rarity || "";
              document.getElementById("edit-item-type").value = markerData.itemType || "";
              document.getElementById("edit-extra-1").value = markerData.extra1 || "";
              document.getElementById("edit-extra-2").value = markerData.extra2 || "";
              document.getElementById("edit-extra-3").value = markerData.extra3 || "";
              itemExtraFields.style.display = "block";
            } else {
              itemExtraFields.style.display = "none";
            }
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
            duplicate.coords = [...markerData.coords];
            const newMarkerObj = addMarker(duplicate);
            // Sticky duplicate: follow mouse until click to drop
            newMarkerObj.dragging.enable();
            const moveHandler = function (e) {
              const latlng = map.layerPointToLatLng(L.point(e.clientX, e.clientY));
              newMarkerObj.setLatLng(latlng);
            };
            document.addEventListener("mousemove", moveHandler);
            const dropHandler = function () {
              const latlng = newMarkerObj.getLatLng();
              duplicate.coords = [latlng.lat, latlng.lng];
              updateMarkerInFirestore(duplicate);
              newMarkerObj.dragging.disable();
              document.removeEventListener("mousemove", moveHandler);
              document.removeEventListener("click", dropHandler);
            };
            document.addEventListener("click", dropHandler);
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
    return markerObj;
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
          currentEditMarker = null;
          editNameInput.value = "";
          editTypeSelect.value = "Item";
          editImageSmall.value = "";
          editImageBig.value = "";
          editDescription.value = "";
          itemExtraFields.style.display = "block";
          editModal.style.left = e.originalEvent.pageX + 10 + "px";
          editModal.style.top = e.originalEvent.pageY + 10 + "px";
          editModal.style.display = "block";
          editForm.onsubmit = function (ev) {
            ev.preventDefault();
            const newMarker = {
              type: editTypeSelect.value,
              name: editNameInput.value || "New Marker",
              coords: [e.latlng.lat, e.latlng.lng],
              imageSmall: editImageSmall.value,
              imageBig: editImageBig.value,
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

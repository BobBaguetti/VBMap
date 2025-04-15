document.addEventListener("DOMContentLoaded", () => {
  console.log("Script loaded!");

  // ------------------------------
  // Firebase Firestore Initialization (compat)
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "YOUR_MSG_SENDER_ID",
    appId: "YOUR_APP_ID"
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
  const bounds = [[0, 0],[3000, 3000]];
  const imageUrl = "./media/images/tempmap.png";
  L.imageOverlay(imageUrl, bounds).addTo(map);
  map.fitBounds(bounds);

  // For "Item" markers, default is markerClusterGroup
  let itemLayer = L.markerClusterGroup();
  const layers = {
    "Teleport": L.layerGroup(),
    "Extraction Portal": L.layerGroup(),
    "Item": itemLayer,
    "Door": L.layerGroup()
  };
  Object.values(layers).forEach(layer => layer.addTo(map));

  let allMarkers = [];

  // ------------------------------
  // Dark Mode Context Menu
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
  // Draggable Modal via handle
  function makeModalDraggable(modal, handle) {
    let isDragging = false, offsetX, offsetY;
    handle.addEventListener("mousedown", (e) => {
      isDragging = true;
      const cs = window.getComputedStyle(modal);
      offsetX = e.clientX - parseInt(cs.left, 10);
      offsetY = e.clientY - parseInt(cs.top, 10);
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
  // Video Popup for Marker Previews
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
  window.openVideoPopup = openVideoPopup; // exposed for inline calls

  // ------------------------------
  // Edit Modal Elements
  const editForm = document.getElementById("edit-form");
  const editNameInput = document.getElementById("edit-name");
  const editTypeSelect = document.getElementById("edit-type");
  const editImageSmall = document.getElementById("edit-image-small");
  const editImageBig = document.getElementById("edit-image-big");
  const editDescription = document.getElementById("edit-description");
  const editRarity = document.getElementById("edit-rarity");
  const editRarityColor = document.getElementById("edit-rarity-color");
  const editItemType = document.getElementById("edit-item-type");
  const editItemTypeColor = document.getElementById("edit-item-type-color");
  const editExtra1 = document.getElementById("edit-extra-1");
  const editExtra1Color = document.getElementById("edit-extra-1-color");
  const editExtra2 = document.getElementById("edit-extra-2");
  const editExtra2Color = document.getElementById("edit-extra-2-color");
  const editExtra3 = document.getElementById("edit-extra-3");
  const editExtra3Color = document.getElementById("edit-extra-3-color");
  const editVideoURL = document.getElementById("edit-video-url");
  const itemExtraFields = document.getElementById("item-extra-fields");
  let currentEditMarker = null;

  function hideEditModal() {
    editModal.style.display = "none";
    currentEditMarker = null;
    editForm.onsubmit = null;
  }
  document.getElementById("edit-cancel").addEventListener("click", hideEditModal);
  editForm.addEventListener("submit", function(e) {
    e.preventDefault();
    if (!currentEditMarker) return;
    const data = currentEditMarker.data;
    data.name = editNameInput.value;
    data.type = editTypeSelect.value;
    data.imageSmall = editImageSmall.value;
    data.imageBig = editImageBig.value;
    data.description = editDescription.value;
    data.videoURL = editVideoURL.value || "";
    if (data.type === "Item") {
      data.rarity = editRarity.value;
      data.rarityColor = editRarityColor.value;
      data.itemType = editItemType.value;
      data.itemTypeColor = editItemTypeColor.value;
      data.extra1 = editExtra1.value;
      data.extra1Color = editExtra1Color.value;
      data.extra2 = editExtra2.value;
      data.extra2Color = editExtra2Color.value;
      data.extra3 = editExtra3.value;
      data.extra3Color = editExtra3Color.value;
    } else {
      delete data.rarity; 
      delete data.rarityColor;
      delete data.itemType; 
      delete data.itemTypeColor;
      delete data.extra1; 
      delete data.extra1Color;
      delete data.extra2; 
      delete data.extra2Color;
      delete data.extra3; 
      delete data.extra3Color;
      delete data.videoURL;  // optional
    }
    currentEditMarker.markerObj.setPopupContent(createPopupContent(data));
    updateMarkerInFirestore(data);
    hideEditModal();
  });
  editTypeSelect.addEventListener("change", function() {
    if (this.value === "Item") {
      itemExtraFields.style.display = "block";
    } else {
      itemExtraFields.style.display = "none";
    }
  });

  // ------------------------------
  // Firebase Save/Update
  function updateMarkerInFirestore(m) {
    if (m.id) {
      db.collection("markers").doc(m.id).set(m).then(() => {
        console.log("Marker updated:", m.id);
      }).catch(console.error);
    } else {
      db.collection("markers").add(m).then(docRef => {
        m.id = docRef.id;
        console.log("Marker added with ID:", docRef.id);
      }).catch(console.error);
    }
  }

  // ------------------------------
  // Create Icon / Popup
  function createCustomIcon(m) {
    return L.divIcon({
      html: `
        <div class="custom-marker">
          <div class="marker-border"></div>
          ${m.imageSmall ? `<img src="${m.imageSmall}" class="marker-icon"/>` : ""}
        </div>
      `,
      className: "custom-marker-container",
      iconSize: [32, 32]
    });
  }
  function createPopupContent(m) {
    // For an item marker, we combine item name, item type, and rarity
    // We also apply color styling from the user’s color pickers
    let itemTypeLine = "";
    let rarityText = "";
    if (m.type === "Item") {
      const rarityStyle = m.rarityColor ? `style="color:${m.rarityColor}"` : "";
      rarityText = m.rarity 
        ? `<span class="popup-rarity" ${rarityStyle}>${m.rarity}</span>` 
        : "";
      const itemTypeStyle = m.itemTypeColor ? `style="color:${m.itemTypeColor}"` : "";
      itemTypeLine = m.itemType 
        ? `<span class="popup-type" ${itemTypeStyle}>${m.itemType}</span>` 
        : "";
    }
    // Extra lines if item has them
    const lines = [];
    if (m.type === "Item" && m.extra1) {
      lines.push(`<p style="color:${m.extra1Color || "#fff"}">${m.extra1}</p>`);
    }
    if (m.type === "Item" && m.extra2) {
      lines.push(`<p style="color:${m.extra2Color || "#fff"}">${m.extra2}</p>`);
    }
    if (m.type === "Item" && m.extra3) {
      lines.push(`<p style="color:${m.extra3Color || "#fff"}">${m.extra3}</p>`);
    }
    let extraLines = lines.join("");

    // Build the first line for item: "Name / itemType / rarity"
    // For other types, just show the name
    let topLine = `<h3 class="popup-name">${m.name}</h3>`;
    if (m.type === "Item") {
      topLine = `<h3 class="popup-name">${m.name}</h3>`
                + (itemTypeLine ? ` <span>${itemTypeLine}</span>` : "")
                + (rarityText ? ` <span>${rarityText}</span>` : "");
    }

    // If marker has a videoURL, we add a "Play Video" button
    let videoButton = "";
    if (m.videoURL) {
      videoButton = `<button class="more-info-btn" onclick="openVideoPopup(event.clientX, event.clientY, '${m.videoURL}')">Play Video</button>`;
    }

    return `
      <div class="custom-popup">
        <div class="popup-header">
          ${m.imageBig ? `<img src="${m.imageBig}" class="popup-icon"/>` : ""}
          <div class="popup-title">
            ${topLine}
          </div>
        </div>
        <div class="popup-body">
          ${m.description ? `<p>${m.description}</p>` : ""}
          ${extraLines}
          ${videoButton}
        </div>
      </div>
    `;
  }

  // ------------------------------
  // Toggle Marker Clustering
  document.getElementById("disable-grouping").addEventListener("change", function() {
    map.removeLayer(layers["Item"]);
    if (this.checked) {
      layers["Item"] = L.layerGroup();
    } else {
      layers["Item"] = L.markerClusterGroup();
    }
    // Re-add all item markers
    allMarkers.forEach(item => {
      if (item.data.type === "Item") {
        layers["Item"].addLayer(item.markerObj);
      }
    });
    layers["Item"].addTo(map);
  });

  // ------------------------------
  // Add Marker
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
    
    markerObj.on("contextmenu", (e) => {
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
            editVideoURL.value = markerData.videoURL || "";
            if (markerData.type === "Item") {
              editRarity.value = markerData.rarity || "";
              editRarityColor.value = markerData.rarityColor || "#ffffff";
              editItemType.value = markerData.itemType || "";
              editItemTypeColor.value = markerData.itemTypeColor || "#ffffff";
              editExtra1.value = markerData.extra1 || "";
              editExtra1Color.value = markerData.extra1Color || "#ffffff";
              editExtra2.value = markerData.extra2 || "";
              editExtra2Color.value = markerData.extra2Color || "#ffffff";
              editExtra3.value = markerData.extra3 || "";
              editExtra3Color.value = markerData.extra3Color || "#ffffff";
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
            // Sticky duplicate: follow mouse until user clicks to drop
            newMarkerObj.dragging.enable();
            const moveHandler = (evt) => {
              const latlng = map.layerPointToLatLng(L.point(evt.clientX, evt.clientY));
              newMarkerObj.setLatLng(latlng);
            };
            document.addEventListener("mousemove", moveHandler);
            const dropHandler = () => {
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
  // Load Markers
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
  map.on("contextmenu", function(e) {
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
          editVideoURL.value = "";
          itemExtraFields.style.display = "block";
          editModal.style.left = e.originalEvent.pageX + 10 + "px";
          editModal.style.top = e.originalEvent.pageY + 10 + "px";
          editModal.style.display = "block";
          editForm.onsubmit = function(evt) {
            evt.preventDefault();
            const newMarker = {
              type: editTypeSelect.value,
              name: editNameInput.value || "New Marker",
              coords: [e.latlng.lat, e.latlng.lng],
              imageSmall: editImageSmall.value,
              imageBig: editImageBig.value,
              description: editDescription.value,
              location: "",
              notes: [],
              videoURL: editVideoURL.value || ""
            };
            if (newMarker.type === "Item") {
              newMarker.rarity = editRarity.value;
              newMarker.rarityColor = editRarityColor.value;
              newMarker.itemType = editItemType.value;
              newMarker.itemTypeColor = editItemTypeColor.value;
              newMarker.extra1 = editExtra1.value;
              newMarker.extra1Color = editExtra1Color.value;
              newMarker.extra2 = editExtra2.value;
              newMarker.extra2Color = editExtra2Color.value;
              newMarker.extra3 = editExtra3.value;
              newMarker.extra3Color = editExtra3Color.value;
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
  // Sidebar Toggle & Map Resize
  document.getElementById("sidebar-toggle").addEventListener("click", function() {
    const sidebar = document.getElementById("sidebar");
    const mapDiv = document.getElementById("map");
    sidebar.classList.toggle("hidden");
    mapDiv.style.marginLeft = sidebar.classList.contains("hidden") ? "0" : "300px";
    map.invalidateSize();
  });

  // ------------------------------
  // Basic Search
  document.getElementById("search-bar").addEventListener("input", function() {
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

document.addEventListener("DOMContentLoaded", () => {
  console.log("Script loaded!");

  // ------------------------------
  // Firebase Firestore Initialization
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "yourproject.firebaseapp.com",
    projectId: "yourproject",
    storageBucket: "yourproject.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // ------------------------------
  // Map Setup
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

  // We define the layers in alphabetical order
  let itemLayer = L.markerClusterGroup();
  const layers = {
    "Door": L.layerGroup(),
    "Extraction Portal": L.layerGroup(),
    "Item": itemLayer,
    "Teleport": L.layerGroup()
  };
  Object.values(layers).forEach(layer => layer.addTo(map));

  let allMarkers = [];

  // ------------------------------
  // Context Menu
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
    zIndex: 2000,
    boxShadow: "0px 2px 6px rgba(0,0,0,0.5)"
  });

  function showContextMenu(x, y, options) {
    contextMenu.innerHTML = "";
    options.forEach(opt => {
      const item = document.createElement("div");
      item.innerText = opt.text;
      item.style.padding = "5px 10px";
      item.style.cursor = "pointer";
      item.style.whiteSpace = "nowrap";
      item.addEventListener("click", () => {
        opt.action();
        contextMenu.style.display = "none";
      });
      contextMenu.appendChild(item);
    });
    contextMenu.style.left = x + "px";
    contextMenu.style.top = y + "px";
    contextMenu.style.display = "block";
  }
  document.addEventListener("click", () => {
    contextMenu.style.display = "none";
  });

  // ------------------------------
  // Draggable Edit Modal
  const editModal = document.getElementById("edit-modal");
  const editModalHandle = document.getElementById("edit-modal-handle");
  let isDragging = false, offsetX, offsetY;
  editModalHandle.addEventListener("mousedown", (e) => {
    isDragging = true;
    const cs = window.getComputedStyle(editModal);
    offsetX = e.clientX - parseInt(cs.left, 10);
    offsetY = e.clientY - parseInt(cs.top, 10);
    e.preventDefault();
  });
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      editModal.style.left = (e.clientX - offsetX) + "px";
      editModal.style.top = (e.clientY - offsetY) + "px";
    }
  });
  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  // ------------------------------
  // Video Popup
  const videoPopup = document.getElementById("video-popup");
  const videoPlayer = document.getElementById("video-player");
  const videoSource = document.getElementById("video-source");
  document.getElementById("video-close").addEventListener("click", () => {
    videoPopup.style.display = "none";
    videoPlayer.pause();
  });
  function openVideoPopup(x, y, url) {
    videoSource.src = url;
    videoPlayer.load();
    videoPopup.style.left = x + "px";
    videoPopup.style.top = y + "px";
    videoPopup.style.display = "block";
  }
  window.openVideoPopup = openVideoPopup;

  // ------------------------------
  // Edit Modal Fields
  const editForm = document.getElementById("edit-form");
  const editName = document.getElementById("edit-name");
  const editNameColor = document.getElementById("edit-name-color");
  const editType = document.getElementById("edit-type");
  const editImageSmall = document.getElementById("edit-image-small");
  const editImageBig = document.getElementById("edit-image-big");
  const editVideoURL = document.getElementById("edit-video-url");

  // Item fields
  const itemExtraFields = document.getElementById("item-extra-fields");
  const editRarity = document.getElementById("edit-rarity");
  const editRarityColor = document.getElementById("edit-rarity-color");
  const editItemType = document.getElementById("edit-item-type");
  const editItemTypeColor = document.getElementById("edit-item-type-color");
  const editDescription = document.getElementById("edit-description");
  const editDescriptionColor = document.getElementById("edit-description-color");
  const editExtraInfo = document.getElementById("edit-extra-info");
  const editExtraInfoColor = document.getElementById("edit-extra-info-color");

  // Non-item
  const nonItemDescription = document.getElementById("edit-description-non-item");
  const nonItemDescriptionColor = document.getElementById("edit-description-non-item-color");

  let currentEditMarker = null;

  // Rarity defaults
  const defaultRarityColors = {
    "common": "#CCCCCC",
    "uncommon": "#56DE56",
    "rare": "#3498db",
    "epic": "#9b59b6",
    "legendary": "#f39c12"
  };
  editRarity.addEventListener("change", function() {
    if (defaultRarityColors[this.value]) {
      editRarityColor.value = defaultRarityColors[this.value];
    }
  });

  // Show/hide item fields
  editType.addEventListener("change", function() {
    if (this.value === "Item") {
      itemExtraFields.style.display = "block";
      nonItemDescription.style.display = "none";
    } else {
      itemExtraFields.style.display = "none";
      nonItemDescription.style.display = "block";
    }
  });

  // Cancel
  document.getElementById("edit-cancel").addEventListener("click", () => {
    editModal.style.display = "none";
    currentEditMarker = null;
  });

  // Submit
  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentEditMarker) return;
    const data = currentEditMarker.data;
    data.name = editName.value;
    data.nameColor = editNameColor.value;
    data.type = editType.value;
    data.imageSmall = editImageSmall.value;
    data.imageBig = editImageBig.value;
    data.videoURL = editVideoURL.value || "";

    if (data.type === "Item") {
      data.rarity = editRarity.value;
      data.rarityColor = editRarityColor.value;
      data.itemType = editItemType.value;
      data.itemTypeColor = editItemTypeColor.value;
      data.description = editDescription.value;
      data.descriptionColor = editDescriptionColor.value;
      data.extraInfo = editExtraInfo.value || "";
      data.extraInfoColor = editExtraInfoColor.value;
    } else {
      data.description = nonItemDescription.value;
      data.descriptionColor = nonItemDescriptionColor.value;
      delete data.rarity;
      delete data.rarityColor;
      delete data.itemType;
      delete data.itemTypeColor;
      delete data.extraInfo;
      delete data.extraInfoColor;
    }
    currentEditMarker.markerObj.setPopupContent(createPopupContent(data));
    updateMarkerInFirestore(data);
    editModal.style.display = "none";
    currentEditMarker = null;
  });

  // ------------------------------
  // Marker Icon & Popup
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
    // For item markers: Name, itemType, rarity, description, extraInfo
    let itemTypeHTML = "";
    let rarityHTML = "";
    let descHTML = "";
    let extraInfoHTML = "";
    if (m.type === "Item") {
      if (m.itemType) {
        itemTypeHTML = `<div style="font-size:16px;color:${m.itemTypeColor||"#fff"};margin:2px 0;">${m.itemType}</div>`;
      }
      if (m.rarity) {
        rarityHTML = `<div style="font-size:16px;color:${m.rarityColor||"#fff"};margin:2px 0;">${m.rarity}</div>`;
      }
      if (m.description) {
        descHTML = `<p style="margin:5px 0;color:${m.descriptionColor||"#fff"};">${m.description}</p>`;
      }
      if (m.extraInfo) {
        extraInfoHTML = `<p style="color:${m.extraInfoColor||"#fff"};margin:2px 0;">${m.extraInfo}</p>`;
      }
    } else {
      // Non-item markers
      if (m.description) {
        descHTML = `<p style="margin:5px 0;color:${m.descriptionColor||"#fff"};">${m.description}</p>`;
      }
    }
    let nameHTML = `<h3 style="margin:0;font-size:20px;color:${m.nameColor||"#fff"};">${m.name}</h3>`;

    let videoButton = "";
    if (m.videoURL) {
      videoButton = `<button class="more-info-btn" onclick="openVideoPopup(event.clientX, event.clientY, '${m.videoURL}')">Play Video</button>`;
    }

    const scaledImage = m.imageBig
      ? `<img src="${m.imageBig}" style="width:64px;height:64px;object-fit:contain;border:2px solid #777;border-radius:4px;" />`
      : "";
    
    return `
      <div class="custom-popup">
        <div class="popup-header">
          ${scaledImage}
          <div style="margin-left:15px;">
            ${nameHTML}
            ${itemTypeHTML}
            ${rarityHTML}
          </div>
        </div>
        <div class="popup-body">
          ${descHTML}
          ${extraInfoHTML}
          ${videoButton}
        </div>
      </div>
    `;
  }

  // ------------------------------
  // Firestore Persistence
  function updateMarkerInFirestore(m) {
    if (m.id) {
      db.collection("markers").doc(m.id).set(m).then(() => {
        console.log("Updated marker:", m.id);
      }).catch(console.error);
    } else {
      db.collection("markers").add(m).then(docRef => {
        m.id = docRef.id;
        console.log("Added marker with ID:", docRef.id);
      }).catch(console.error);
    }
  }

  // Add Marker
  function addMarker(m) {
    const markerObj = L.marker(
      [m.coords[0], m.coords[1]],
      { icon: createCustomIcon(m), draggable: false }
    );
    markerObj.bindPopup(createPopupContent(m), {
      className: "custom-popup-wrapper",
      maxWidth: 350
    });
    layers[m.type].addLayer(markerObj);
    allMarkers.push({ markerObj, data: m });

    markerObj.on("contextmenu", (evt) => {
      evt.originalEvent.preventDefault();
      showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [
        {
          text: "Edit Marker",
          action: () => {
            currentEditMarker = { markerObj, data: m };
            editName.value = m.name || "";
            editNameColor.value = m.nameColor || "#ffffff";
            editType.value = m.type || "Item";
            editImageSmall.value = m.imageSmall || "";
            editImageBig.value = m.imageBig || "";
            editVideoURL.value = m.videoURL || "";

            if (m.type === "Item") {
              itemExtraFields.style.display = "block";
              nonItemDescription.style.display = "none";
              editRarity.value = m.rarity || "";
              editRarityColor.value = m.rarityColor || "#ffffff";
              editItemType.value = m.itemType || "";
              editItemTypeColor.value = m.itemTypeColor || "#ffffff";
              editDescription.value = m.description || "";
              editDescriptionColor.value = m.descriptionColor || "#ffffff";
              editExtraInfo.value = m.extraInfo || "";
              editExtraInfoColor.value = m.extraInfoColor || "#ffffff";
            } else {
              itemExtraFields.style.display = "none";
              nonItemDescription.style.display = "block";
              nonItemDescription.value = m.description || "";
              nonItemDescriptionColor.value = m.descriptionColor || "#ffffff";
            }
            editModal.style.left = (evt.originalEvent.pageX + 10) + "px";
            editModal.style.top = (evt.originalEvent.pageY + 10) + "px";
            editModal.style.display = "block";
          }
        },
        {
          text: "Duplicate Marker",
          action: () => {
            const dup = JSON.parse(JSON.stringify(m));
            dup.name = `${m.name} (copy)`;
            dup.coords = [...m.coords];
            const newMarkerObj = addMarker(dup);
            newMarkerObj.dragging.enable();
            const moveHandler = (ev2) => {
              const latlng = map.layerPointToLatLng(L.point(ev2.clientX, ev2.clientY));
              newMarkerObj.setLatLng(latlng);
            };
            const dropHandler = () => {
              const latlng = newMarkerObj.getLatLng();
              dup.coords = [latlng.lat, latlng.lng];
              updateMarkerInFirestore(dup);
              newMarkerObj.dragging.disable();
              document.removeEventListener("mousemove", moveHandler);
              document.removeEventListener("click", dropHandler);
            };
            document.addEventListener("mousemove", moveHandler);
            document.addEventListener("click", dropHandler);
            updateMarkerInFirestore(dup);
          }
        },
        {
          text: markerObj.dragging.enabled() ? "Disable Drag" : "Enable Drag",
          action: () => {
            if (markerObj.dragging.enabled()) {
              markerObj.dragging.disable();
            } else {
              markerObj.dragging.enable();
              markerObj.on("dragend", () => {
                const latlng = markerObj.getLatLng();
                m.coords = [latlng.lat, latlng.lng];
                updateMarkerInFirestore(m);
              });
            }
          }
        }
      ]);
    });
    return markerObj;
  }

  // Load Markers
  function loadMarkers() {
    db.collection("markers").get().then(querySnapshot => {
      querySnapshot.forEach(doc => {
        let data = doc.data();
        data.id = doc.id;
        if (!data.type || !layers[data.type]) {
          console.error(`Invalid marker type: ${data.type}`);
          return;
        }
        if (!data.coords) data.coords = [1500,1500];
        addMarker(data);
      });
    }).catch(err => {
      console.error("Error loading markers from Firestore:", err);
      // fallback to local JSON
      fetch("./data/markerData.json").then(resp => {
        if (!resp.ok) throw new Error("Network response was not ok");
        return resp.json();
      }).then(jsonData => {
        jsonData.forEach(m => {
          if (!m.type || !layers[m.type]) {
            console.error(`Invalid marker type: ${m.type}`);
            return;
          }
          addMarker(m);
        });
      }).catch(err2 => console.error("Error loading local JSON:", err2));
    });
  }
  loadMarkers();

  // Right-click on map => create new marker
  map.on("contextmenu", (evt) => {
    showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [
      {
        text: "Create New Marker",
        action: () => {
          currentEditMarker = null;
          editName.value = "";
          editNameColor.value = "#ffffff";
          editType.value = "Item";
          editImageSmall.value = "";
          editImageBig.value = "";
          editVideoURL.value = "";
          editRarity.value = "";
          editRarityColor.value = "#ffffff";
          editItemType.value = "";
          editItemTypeColor.value = "#ffffff";
          editDescription.value = "";
          editDescriptionColor.value = "#ffffff";
          editExtraInfo.value = "";
          editExtraInfoColor.value = "#ffffff";
          
          itemExtraFields.style.display = "block";
          nonItemDescription.style.display = "none";

          editModal.style.left = (evt.originalEvent.pageX + 10) + "px";
          editModal.style.top = (evt.originalEvent.pageY + 10) + "px";
          editModal.style.display = "block";

          editForm.onsubmit = function(ev) {
            ev.preventDefault();
            const newMarker = {
              type: editType.value,
              name: editName.value || "New Marker",
              nameColor: editNameColor.value || "#ffffff",
              coords: [evt.latlng.lat, evt.latlng.lng],
              imageSmall: editImageSmall.value,
              imageBig: editImageBig.value,
              videoURL: editVideoURL.value || ""
            };
            if (newMarker.type === "Item") {
              newMarker.rarity = editRarity.value;
              newMarker.rarityColor = editRarityColor.value;
              newMarker.itemType = editItemType.value;
              newMarker.itemTypeColor = editItemTypeColor.value;
              newMarker.description = editDescription.value;
              newMarker.descriptionColor = editDescriptionColor.value;
              newMarker.extraInfo = editExtraInfo.value;
              newMarker.extraInfoColor = editExtraInfoColor.value;
            } else {
              newMarker.description = nonItemDescription.value;
              newMarker.descriptionColor = nonItemDescriptionColor.value;
            }
            addMarker(newMarker);
            updateMarkerInFirestore(newMarker);
            editModal.style.display = "none";
            editForm.onsubmit = null;
          };
        }
      }
    ]);
  });

  // Sidebar Toggle
  document.getElementById("sidebar-toggle").addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar");
    const mapDiv = document.getElementById("map");
    sidebar.classList.toggle("hidden");
    mapDiv.style.marginLeft = sidebar.classList.contains("hidden") ? "0" : "300px";
    map.invalidateSize();
  });

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

  // Marker Grouping Toggle
  document.getElementById("disable-grouping").addEventListener("change", function() {
    map.removeLayer(layers["Item"]);
    if (this.checked) {
      layers["Item"] = L.layerGroup();
    } else {
      layers["Item"] = L.markerClusterGroup();
    }
    allMarkers.forEach(item => {
      if (item.data.type === "Item") {
        layers["Item"].addLayer(item.markerObj);
      }
    });
    layers["Item"].addTo(map);
  });
});

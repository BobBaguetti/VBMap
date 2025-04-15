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

  // Marker layers
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
  // Dark Context Menu
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
    options.forEach(opt => {
      const menuItem = document.createElement("div");
      menuItem.innerText = opt.text;
      menuItem.style.padding = "5px 10px";
      menuItem.style.cursor = "pointer";
      menuItem.style.whiteSpace = "nowrap";
      menuItem.addEventListener("click", () => {
        opt.action();
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
  window.openVideoPopup = openVideoPopup; // expose function globally

  // ------------------------------
  // Edit Modal: Fields
  const editForm = document.getElementById("edit-form");
  const editName = document.getElementById("edit-name");
  const editNameColor = document.getElementById("edit-name-color");
  const editType = document.getElementById("edit-type");
  const editImageSmall = document.getElementById("edit-image-small");
  const editImageBig = document.getElementById("edit-image-big");
  const editVideoURL = document.getElementById("edit-video-url");
  
  // Item-specific
  const itemExtraFields = document.getElementById("item-extra-fields");
  const editItemType = document.getElementById("edit-item-type");
  const editItemTypeColor = document.getElementById("edit-item-type-color");
  const editRarity = document.getElementById("edit-rarity");
  const editRarityColor = document.getElementById("edit-rarity-color");
  const editDescription = document.getElementById("edit-description");
  const editDescriptionColor = document.getElementById("edit-description-color");
  const extraLinesContainer = document.getElementById("extra-lines");
  const addExtraLineBtn = document.getElementById("add-extra-line");
  let extraLines = [];

  // Non-item
  const nonItemDescription = document.getElementById("edit-description-non-item");
  const nonItemDescriptionColor = document.getElementById("edit-description-non-item-color");

  let currentEditMarker = null;

  // Rarity default colors
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

  // Show/hide item vs. non-item fields
  editType.addEventListener("change", function() {
    if (this.value === "Item") {
      itemExtraFields.style.display = "block";
      nonItemDescription.style.display = "none";
    } else {
      itemExtraFields.style.display = "none";
      nonItemDescription.style.display = "block";
    }
  });

  // Extra Info lines
  function renderExtraLinesUI() {
    extraLinesContainer.innerHTML = "";
    extraLines.forEach((line, idx) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.style.alignItems = "center";

      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.value = line.text;
      textInput.style.background = "#E5E6E8";
      textInput.style.color = "#000";
      textInput.addEventListener("input", () => {
        extraLines[idx].text = textInput.value;
      });

      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.value = line.color || "#ffffff";
      colorInput.style.width = "24px";
      colorInput.style.height = "24px";
      colorInput.style.border = "none";
      colorInput.style.marginLeft = "5px";
      colorInput.addEventListener("change", () => {
        extraLines[idx].color = colorInput.value;
      });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "x";
      removeBtn.style.marginLeft = "5px";
      removeBtn.addEventListener("click", () => {
        extraLines.splice(idx, 1);
        renderExtraLinesUI();
      });

      row.appendChild(textInput);
      row.appendChild(colorInput);
      row.appendChild(removeBtn);
      extraLinesContainer.appendChild(row);
    });
  }
  addExtraLineBtn.addEventListener("click", () => {
    extraLines.push({ text: "", color: "#ffffff" });
    renderExtraLinesUI();
  });

  // Cancel
  document.getElementById("edit-cancel").addEventListener("click", () => {
    editModal.style.display = "none";
    currentEditMarker = null;
    extraLines = [];
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
      data.itemType = editItemType.value;
      data.itemTypeColor = editItemTypeColor.value;
      data.rarity = editRarity.value;
      data.rarityColor = editRarityColor.value;
      data.description = editDescription.value;
      data.descriptionColor = editDescriptionColor.value;
      data.extraLines = JSON.parse(JSON.stringify(extraLines));
    } else {
      data.description = nonItemDescription.value;
      data.descriptionColor = nonItemDescriptionColor.value;
      delete data.itemType;
      delete data.itemTypeColor;
      delete data.rarity;
      delete data.rarityColor;
      delete data.extraLines;
    }
    currentEditMarker.markerObj.setPopupContent(createPopupContent(data));
    updateMarkerInFirestore(data);
    editModal.style.display = "none";
    extraLines = [];
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
    // If item, name at top (m.nameColor), itemType below (m.itemTypeColor), rarity below that (m.rarityColor).
    // Then description in m.descriptionColor, plus extraLines
    let itemLines = "";
    if (m.type === "Item" && m.extraLines && m.extraLines.length > 0) {
      m.extraLines.forEach(line => {
        itemLines += `<p style="color:${line.color};margin:0;">${line.text}</p>`;
      });
    }
    let nameHTML = `<h3 style="margin:0;font-size:20px;color:${m.nameColor||"#fff"};">${m.name}</h3>`;
    let typeHTML = "";
    let rarityHTML = "";
    if (m.type === "Item") {
      if (m.itemType) {
        typeHTML = `<div style="font-size:16px;color:${m.itemTypeColor||"#fff"};margin:2px 0 2px 0;">${m.itemType}</div>`;
      }
      if (m.rarity) {
        rarityHTML = `<div style="font-size:16px;color:${m.rarityColor||"#fff"};margin:2px 0 2px 0;">${m.rarity}</div>`;
      }
    }
    const descColor = m.descriptionColor || "#fff";
    const descHTML = m.description ? `<p style="margin:5px 0;color:${descColor};">${m.description}</p>` : "";
    let videoBtn = "";
    if (m.videoURL) {
      videoBtn = `<button class="more-info-btn" onclick="openVideoPopup(event.clientX, event.clientY, '${m.videoURL}')">Play Video</button>`;
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
            ${typeHTML}
            ${rarityHTML}
          </div>
        </div>
        <div class="popup-body">
          ${descHTML}
          ${itemLines}
          ${videoBtn}
        </div>
      </div>
    `;
  }

  // ------------------------------
  // Firestore Persist
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

  // ------------------------------
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
            // populate fields
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
              editItemType.value = m.itemType || "";
              editItemTypeColor.value = m.itemTypeColor || "#ffffff";
              editRarity.value = m.rarity || "";
              editRarityColor.value = m.rarityColor || "#ffffff";
              editDescription.value = m.description || "";
              editDescriptionColor.value = m.descriptionColor || "#ffffff";
              extraLines = m.extraLines ? JSON.parse(JSON.stringify(m.extraLines)) : [];
              renderExtraLinesUI();
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
            // Sticky duplicate
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

  // Render Extra Lines for the Item
  function renderExtraLinesUI() {
    extraLinesContainer.innerHTML = "";
    extraLines.forEach((line, idx) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.style.alignItems = "center";

      const txt = document.createElement("input");
      txt.type = "text";
      txt.value = line.text;
      txt.style.background = "#E5E6E8";
      txt.style.color = "#000";
      txt.addEventListener("input", () => {
        extraLines[idx].text = txt.value;
      });

      const col = document.createElement("input");
      col.type = "color";
      col.value = line.color || "#ffffff";
      col.style.width = "24px";
      col.style.height = "24px";
      col.style.border = "none";
      col.style.marginLeft = "5px";
      col.addEventListener("change", () => {
        extraLines[idx].color = col.value;
      });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "x";
      removeBtn.style.marginLeft = "5px";
      removeBtn.addEventListener("click", () => {
        extraLines.splice(idx, 1);
        renderExtraLinesUI();
      });

      row.appendChild(txt);
      row.appendChild(col);
      row.appendChild(removeBtn);
      extraLinesContainer.appendChild(row);
    });
  }

  // ------------------------------
  // Load Markers (Firestore or local JSON)
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
      // fallback to JSON
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
      }).catch(err2 => console.error("Error loading JSON markers:", err2));
    });
  }
  loadMarkers();

  // ------------------------------
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
          editDescription.value = "";
          editDescriptionColor.value = "#ffffff";
          
          itemExtraFields.style.display = "block";
          nonItemDescription.style.display = "none";
          extraLines = [];
          renderExtraLinesUI();

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
              newMarker.itemType = editItemType.value;
              newMarker.itemTypeColor = editItemTypeColor.value;
              newMarker.rarity = editRarity.value;
              newMarker.rarityColor = editRarityColor.value;
              newMarker.description = editDescription.value;
              newMarker.descriptionColor = editDescriptionColor.value;
              newMarker.extraLines = JSON.parse(JSON.stringify(extraLines));
            } else {
              newMarker.description = nonItemDescription.value;
              newMarker.descriptionColor = nonItemDescriptionColor.value;
            }
            addMarker(newMarker);
            updateMarkerInFirestore(newMarker);
            editModal.style.display = "none";
            extraLines = [];
            editForm.onsubmit = null;
          };
        }
      }
    ]);
  });

  // ------------------------------
  // Sidebar Toggle
  document.getElementById("sidebar-toggle").addEventListener("click", () => {
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

  // ------------------------------
  // Toggle Marker Grouping
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

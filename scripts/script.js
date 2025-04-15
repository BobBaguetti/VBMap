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
  const bounds = [[0,0],[3000,3000]];
  const imageUrl = "./media/images/tempmap.png";
  L.imageOverlay(imageUrl, bounds).addTo(map);
  map.fitBounds(bounds);

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
  let isDragging = false, offsetX = 0, offsetY = 0;
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
  // Edit Modal + Fields
  const editForm = document.getElementById("edit-form");
  const editName = document.getElementById("edit-name");
  const pickrName = createPickr('#pickr-name');
  const editType = document.getElementById("edit-type");
  const editImageSmall = document.getElementById("edit-image-small");
  const editImageBig = document.getElementById("edit-image-big");
  const editVideoURL = document.getElementById("edit-video-url");

  // Item Fields
  const itemExtraFields = document.getElementById("item-extra-fields");
  const editRarity = document.getElementById("edit-rarity");
  const pickrRarity = createPickr('#pickr-rarity');
  const editItemType = document.getElementById("edit-item-type");
  const pickrItemType = createPickr('#pickr-itemtype');
  const editDescription = document.getElementById("edit-description");
  const pickrDescItem = createPickr('#pickr-desc-item');

  // Dynamic Extra Info
  const extraLinesContainer = document.getElementById("extra-lines");
  const addExtraLineBtn = document.getElementById("add-extra-line");
  let extraLines = [];

  // Non-Item
  const nonItemDescription = document.getElementById("edit-description-non-item");
  const pickrDescNonItem = createPickr('#pickr-desc-nonitem');

  let currentEditMarker = null;

  // Defaults for Rarity
  const defaultRarityColors = {
    "common": "#CCCCCC",
    "uncommon": "#56DE56",
    "rare": "#3498db",
    "epic": "#9b59b6",
    "legendary": "#f39c12"
  };
  editRarity.addEventListener("change", function() {
    if (defaultRarityColors[this.value]) {
      pickrRarity.setColor(defaultRarityColors[this.value]);
    }
  });

  // Show/Hide item fields
  editType.addEventListener("change", () => {
    if (editType.value === "Item") {
      itemExtraFields.style.display = "block";
      nonItemDescription.style.display = "none";
    } else {
      itemExtraFields.style.display = "none";
      nonItemDescription.style.display = "block";
    }
  });

  // Extra Info
  function renderExtraLines() {
    extraLinesContainer.innerHTML = "";
    extraLines.forEach((lineObj, idx) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.style.marginBottom = "5px";

      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.value = lineObj.text;
      textInput.style.background = "#E5E6E8";
      textInput.style.color = "#000";
      textInput.addEventListener("input", () => {
        extraLines[idx].text = textInput.value;
      });

      const colorDiv = document.createElement("div");
      colorDiv.className = "color-btn";
      colorDiv.style.marginLeft = "5px";

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "x";
      removeBtn.style.marginLeft = "5px";
      removeBtn.addEventListener("click", () => {
        extraLines.splice(idx, 1);
        renderExtraLines();
      });

      row.appendChild(textInput);
      row.appendChild(colorDiv);
      row.appendChild(removeBtn);
      extraLinesContainer.appendChild(row);

      // Create a new color pickr instance for each extra line
      const linePickr = Pickr.create({
        el: colorDiv,
        theme: 'nano',
        default: lineObj.color || '#ffffff',
        components: {
          preview: true,
          opacity: true,
          hue: true,
          interaction: { hex: true, rgba: true, input: true, save: true }
        }
      });
      linePickr.on('change', (color) => {
        extraLines[idx].color = color.toHEXA().toString();
      });
      linePickr.on('save', () => { linePickr.hide(); });
    });
  }
  addExtraLineBtn.addEventListener("click", () => {
    extraLines.push({ text: "", color: "#ffffff" });
    renderExtraLines();
  });

  // Cancel Button
  document.getElementById("edit-cancel").addEventListener("click", () => {
    editModal.style.display = "none";
    currentEditMarker = null;
    extraLines = [];
  });

  // Submit Handler
  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentEditMarker) return;
    const data = currentEditMarker.data;
    data.name = editName.value;
    data.nameColor = pickrName.getColor().toHEXA().toString();
    data.type = editType.value;
    data.imageSmall = editImageSmall.value;
    data.imageBig = editImageBig.value;
    data.videoURL = editVideoURL.value || "";

    if (data.type === "Item") {
      data.rarity = editRarity.value;
      data.rarityColor = pickrRarity.getColor().toHEXA().toString();
      data.itemType = editItemType.value;
      data.itemTypeColor = pickrItemType.getColor().toHEXA().toString();
      data.description = editDescription.value;
      data.descriptionColor = pickrDescItem.getColor().toHEXA().toString();
      data.extraLines = JSON.parse(JSON.stringify(extraLines));
    } else {
      data.description = nonItemDescription.value;
      data.descriptionColor = pickrDescNonItem.getColor().toHEXA().toString();
      delete data.rarity;
      delete data.rarityColor;
      delete data.itemType;
      delete data.itemTypeColor;
      delete data.extraLines;
    }
    currentEditMarker.markerObj.setPopupContent(createPopupContent(data));
    updateMarkerInFirestore(data);
    editModal.style.display = "none";
    extraLines = [];
    currentEditMarker = null;
  });

  // Helper: Create a Pickr instance for color picking
  function createPickr(selector) {
    return Pickr.create({
      el: selector,
      theme: 'nano',
      default: '#ffffff',
      components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: { hex: true, rgba: true, input: true, save: true }
      }
    });
  }

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
    let itemTypeHTML = "";
    let rarityHTML = "";
    let descHTML = "";
    let extraHTML = "";
    if (m.type === "Item") {
      if (m.itemType) {
        itemTypeHTML = `<div style="font-size:16px; color:${m.itemTypeColor||"#fff"}; margin:2px 0;">${m.itemType}</div>`;
      }
      if (m.rarity) {
        rarityHTML = `<div style="font-size:16px; color:${m.rarityColor||"#fff"}; margin:2px 0;">${m.rarity}</div>`;
      }
      if (m.description) {
        descHTML = `<p style="margin:5px 0; color:${m.descriptionColor||"#fff"};">${m.description}</p>`;
      }
      if (m.extraLines && m.extraLines.length) {
        m.extraLines.forEach(line => {
          extraHTML += `<p style="margin:0; color:${line.color||"#fff"};">${line.text}</p>`;
        });
      }
    } else {
      if (m.description) {
        descHTML = `<p style="margin:5px 0; color:${m.descriptionColor||"#fff"};">${m.description}</p>`;
      }
    }
    const scaledImage = m.imageBig 
      ? `<img src="${m.imageBig}" style="width:64px; height:64px; object-fit:contain; border:2px solid #777; border-radius:4px;" />`
      : "";
    const nameHTML = `<h3 style="margin:0; font-size:20px; color:${m.nameColor||"#fff"};">${m.name}</h3>`;
    let videoBtn = "";
    if (m.videoURL) {
      videoBtn = `<button class="more-info-btn" onclick="openVideoPopup(event.clientX, event.clientY, '${m.videoURL}')">Play Video</button>`;
    }
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
          ${extraHTML}
          ${videoBtn}
        </div>
      </div>
    `;
  }

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
  function deleteMarkerInFirestore(id) {
    db.collection("markers").doc(id).delete().then(() => {
      console.log("Deleted marker:", id);
    }).catch(console.error);
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
      const options = [
        {
          text: "Edit Marker",
          action: () => {
            currentEditMarker = { markerObj, data: m };
            editName.value = m.name || "";
            pickrName.setColor(m.nameColor || "#ffffff");
            editType.value = m.type || "Item";
            editImageSmall.value = m.imageSmall || "";
            editImageBig.value = m.imageBig || "";
            editVideoURL.value = m.videoURL || "";
            if (m.type === "Item") {
              itemExtraFields.style.display = "block";
              nonItemDescription.style.display = "none";
              editRarity.value = m.rarity || "";
              pickrRarity.setColor(m.rarityColor || "#ffffff");
              editItemType.value = m.itemType || "";
              pickrItemType.setColor(m.itemTypeColor || "#ffffff");
              editDescription.value = m.description || "";
              pickrDescItem.setColor(m.descriptionColor || "#ffffff");
              extraLines = m.extraLines ? JSON.parse(JSON.stringify(m.extraLines)) : [];
              renderExtraLines();
            } else {
              itemExtraFields.style.display = "none";
              nonItemDescription.style.display = "block";
              nonItemDescription.value = m.description || "";
              pickrDescNonItem.setColor(m.descriptionColor || "#ffffff");
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
      ];
      if (m.id) {
        options.push({
          text: "Delete Marker",
          action: () => {
            layers[m.type].removeLayer(markerObj);
            const idx = allMarkers.findIndex(obj => obj.data.id === m.id);
            if (idx !== -1) { allMarkers.splice(idx, 1); }
            deleteMarkerInFirestore(m.id);
          }
        });
      }
      showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, options);
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

  // Right-click on Map => Create Marker
  map.on("contextmenu", (evt) => {
    showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [
      {
        text: "Create New Marker",
        action: () => {
          currentEditMarker = null;
          editName.value = "";
          pickrName.setColor("#ffffff");
          editType.value = "Item";
          editImageSmall.value = "";
          editImageBig.value = "";
          editVideoURL.value = "";
          editRarity.value = "";
          pickrRarity.setColor("#ffffff");
          editItemType.value = "";
          pickrItemType.setColor("#ffffff");
          editDescription.value = "";
          pickrDescItem.setColor("#ffffff");
          extraLines = [];
          renderExtraLines();
          itemExtraFields.style.display = "block";
          nonItemDescription.style.display = "none";

          editModal.style.left = (evt.originalEvent.pageX + 10) + "px";
          editModal.style.top = (evt.originalEvent.pageY + 10) + "px";
          editModal.style.display = "block";

          editForm.onsubmit = (e2) => {
            e2.preventDefault();
            const newMarker = {
              type: editType.value,
              name: editName.value || "New Marker",
              nameColor: pickrName.getColor().toHEXA().toString(),
              coords: [evt.latlng.lat, evt.latlng.lng],
              imageSmall: editImageSmall.value,
              imageBig: editImageBig.value,
              videoURL: editVideoURL.value || ""
            };
            if (newMarker.type === "Item") {
              newMarker.rarity = editRarity.value;
              newMarker.rarityColor = pickrRarity.getColor().toHEXA().toString();
              newMarker.itemType = editItemType.value;
              newMarker.itemTypeColor = pickrItemType.getColor().toHEXA().toString();
              newMarker.description = editDescription.value;
              newMarker.descriptionColor = pickrDescItem.getColor().toHEXA().toString();
              newMarker.extraLines = JSON.parse(JSON.stringify(extraLines));
            } else {
              newMarker.description = nonItemDescription.value;
              newMarker.descriptionColor = pickrDescNonItem.getColor().toHEXA().toString();
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

document.addEventListener("DOMContentLoaded", () => {
  console.log("Script loaded!");

  // ------------------------------
  // Firebase Firestore Initialization
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
  // Map Setup
  const map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 4,
    zoomControl: false
  });
  L.control.zoom({ position: "topright" }).addTo(map);
  const bounds = [[0, 0], [3000, 3000]];
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
  // Global variables for Copy Marker (sticky paste mode)
  let duplicatingMarker = null;
  let duplicatingData = null;
  // Paste tooltip element
  const pasteTooltip = document.getElementById("paste-tooltip");

  // ------------------------------
  // Context Menu Setup
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
    // If right-click cancels paste mode, hide tooltip and clear duplicating globals
    if (duplicatingMarker) {
      duplicatingMarker.dragging.disable();
      duplicatingMarker = null;
      duplicatingData = null;
      pasteTooltip.style.display = "none";
    }
  });

  // ------------------------------
  // Draggable Edit Modal Setup
  const editModal = document.getElementById("edit-modal");
  const editModalHandle = document.getElementById("edit-modal-handle");
  let isDragging = false, modalOffsetX = 0, modalOffsetY = 0;
  editModalHandle.addEventListener("mousedown", (e) => {
    isDragging = true;
    const style = window.getComputedStyle(editModal);
    modalOffsetX = e.clientX - parseInt(style.left, 10);
    modalOffsetY = e.clientY - parseInt(style.top, 10);
    e.preventDefault();
  });
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      editModal.style.left = (e.clientX - modalOffsetX) + "px";
      editModal.style.top = (e.clientY - modalOffsetY) + "px";
    }
  });
  document.addEventListener("mouseup", () => { isDragging = false; });

  // ------------------------------
  // Video Popup Setup
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
  // Edit Modal Fields & Color Picker Initialization
  const editForm = document.getElementById("edit-form");
  const editName = document.getElementById("edit-name");
  const pickrName = Pickr.create({
    el: '#pickr-name',
    theme: 'nano',
    default: '#ffffff',
    components: { preview: true, opacity: true, hue: true, interaction: { hex: true, rgba: true, input: true, save: true } }
  });
  const editType = document.getElementById("edit-type");
  const editImageSmall = document.getElementById("edit-image-small");
  const editImageBig = document.getElementById("edit-image-big");
  const editVideoURL = document.getElementById("edit-video-url");

  // Item-specific fields (inside "item-extra-fields")
  const itemExtraFields = document.getElementById("item-extra-fields");
  const editRarity = document.getElementById("edit-rarity");
  const pickrRarity = Pickr.create({
    el: '#pickr-rarity',
    theme: 'nano',
    default: '#ffffff',
    components: { preview: true, opacity: true, hue: true, interaction: { hex: true, rgba: true, input: true, save: true } }
  });
  const editItemType = document.getElementById("edit-item-type");
  const pickrItemType = Pickr.create({
    el: '#pickr-itemtype',
    theme: 'nano',
    default: '#ffffff',
    components: { preview: true, opacity: true, hue: true, interaction: { hex: true, rgba: true, input: true, save: true } }
  });
  const editDescription = document.getElementById("edit-description");
  const pickrDescItem = Pickr.create({
    el: '#pickr-desc-item',
    theme: 'nano',
    default: '#ffffff',
    components: { preview: true, opacity: true, hue: true, interaction: { hex: true, rgba: true, input: true, save: true } }
  });
  // Non-item description fields
  const nonItemDescription = document.getElementById("edit-description-non-item");
  const pickrDescNonItem = Pickr.create({
    el: '#pickr-desc-nonitem',
    theme: 'nano',
    default: '#ffffff',
    components: { preview: true, opacity: true, hue: true, interaction: { hex: true, rgba: true, input: true, save: true } }
  });

  let currentEditMarker = null;

  // Rarity defaults formatting: force first letter uppercase
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

  // Show/hide item fields based on type in the edit form
  editType.addEventListener("change", () => {
    if (editType.value === "Item") {
      itemExtraFields.style.display = "block";
      nonItemDescription.style.display = "none";
    } else {
      itemExtraFields.style.display = "none";
      nonItemDescription.style.display = "block";
    }
  });

  // ------------------------------
  // Extra Info Dynamic Fields
  let extraLines = [];
  const extraLinesContainer = document.getElementById("extra-lines");
  const addExtraLineBtn = document.getElementById("add-extra-line");
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
      textInput.addEventListener("input", () => { extraLines[idx].text = textInput.value; });

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

      const linePickr = Pickr.create({
        el: colorDiv,
        theme: 'nano',
        default: lineObj.color || '#ffffff',
        components: { preview: true, opacity: true, hue: true, interaction: { hex: true, rgba: true, input: true, save: true } }
      });
      linePickr.on("change", (color) => { extraLines[idx].color = color.toHEXA().toString(); });
      linePickr.on("save", () => { linePickr.hide(); });
    });
  }
  addExtraLineBtn.addEventListener("click", () => {
    extraLines.push({ text: "", color: "#ffffff" });
    renderExtraLines();
  });

  // ------------------------------
  // Global Duplicate Marker (Copy Marker) Sticky Behavior
  map.on("mousemove", (ev) => {
    if (duplicatingMarker) {
      duplicatingMarker.setLatLng(ev.latlng);
      pasteTooltip.style.left = (ev.containerPoint.x + 15) + "px";
      pasteTooltip.style.top = (ev.containerPoint.y + 15) + "px";
      pasteTooltip.style.display = "block";
    }
  });
  map.on("click", (ev) => {
    if (duplicatingMarker) {
      duplicatingData.coords = [ev.latlng.lat, ev.latlng.lng];
      updateMarkerInFirestore(duplicatingData);
      duplicatingMarker.dragging.disable();
      duplicatingMarker = null;
      duplicatingData = null;
      pasteTooltip.style.display = "none";
    }
  });
  // Right-click to cancel paste mode if active
  document.addEventListener("contextmenu", (ev) => {
    if (duplicatingMarker) {
      duplicatingMarker.dragging.disable();
      duplicatingMarker = null;
      duplicatingData = null;
      pasteTooltip.style.display = "none";
    }
  });

  // ------------------------------
  // Cancel Button in Edit Modal
  document.getElementById("edit-cancel").addEventListener("click", () => {
    editModal.style.display = "none";
    currentEditMarker = null;
    extraLines = [];
  });

  // ------------------------------
  // Form Submit Handler (Save changes from Edit Modal)
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
      data.rarity = formatRarity(editRarity.value);
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

  // Helper: Format rarity value with first letter uppercase
  function formatRarity(val) {
    if (!val) return "";
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
  }

  // ------------------------------
  // Helper: Create a Pickr instance (if needed elsewhere)
  function createPickr(el) {
    return Pickr.create({
      el: el,
      theme: 'nano',
      default: '#ffffff',
      components: { preview: true, opacity: true, hue: true, interaction: { hex: true, rgba: true, input: true, save: true } }
    });
  }

  // ------------------------------
  // Marker Icon & Popup Creation
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
        itemTypeHTML = `<div style="font-size:16px;color:${m.itemTypeColor||"#fff"};margin:2px 0;">${m.itemType}</div>`;
      }
      if (m.rarity) {
        rarityHTML = `<div style="font-size:16px;color:${m.rarityColor||"#fff"};margin:2px 0;">${formatRarity(m.rarity)}</div>`;
      }
      if (m.description) {
        descHTML = `<p style="margin:5px 0;color:${m.descriptionColor||"#fff"};">${m.description}</p>`;
      }
      if (m.extraLines && m.extraLines.length) {
        m.extraLines.forEach(line => {
          extraHTML += `<p style="margin:0;color:${line.color||"#fff"};">${line.text}</p>`;
        });
      }
    } else {
      if (m.description) {
        descHTML = `<p style="margin:5px 0;color:${m.descriptionColor||"#fff"};">${m.description}</p>`;
      }
    }
    const nameHTML = `<h3 style="margin:0;font-size:20px;color:${m.nameColor||"#fff"};">${m.name}</h3>`;
    // Reduce gap between image and text from 15px to 5px
    const scaledImg = m.imageBig 
      ? `<img src="${m.imageBig}" style="width:64px;height:64px;object-fit:contain;border:2px solid #777;border-radius:4px;" />`
      : "";
    let videoBtn = "";
    if (m.videoURL) {
      videoBtn = `<button class="more-info-btn" onclick="openVideoPopup(event.clientX, event.clientY, '${m.videoURL}')">Play Video</button>`;
    }
    return `
      <div class="custom-popup">
        <div class="popup-header" style="display:flex; gap:5px;">
          ${scaledImg}
          <div style="margin-left:5px;">
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

  // ------------------------------
  // Firestore Persistence Functions
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

  // ------------------------------
  // Add Marker Function (with Delete and Copy Marker options)
  function addMarker(m) {
    const markerObj = L.marker([m.coords[0], m.coords[1]], {
      icon: createCustomIcon(m),
      draggable: false
    });
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
            editType.value = m.type || "Door";
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
          text: "Copy Marker",
          action: () => {
            const dup = JSON.parse(JSON.stringify(m));
            dup.name = `${m.name} (copy)`;
            dup.coords = [...m.coords];
            const newMarkerObj = addMarker(dup);
            // Enable sticky copy mode:
            newMarkerObj.dragging.enable();
            duplicatingMarker = newMarkerObj;
            duplicatingData = dup;
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
      // Always include Delete Marker option
      options.push({
        text: "Delete Marker",
        action: () => {
          layers[m.type].removeLayer(markerObj);
          const idx = allMarkers.findIndex(o => o.data.id === m.id);
          if (idx !== -1) {
            allMarkers.splice(idx, 1);
          }
          if (m.id) {
            deleteMarkerInFirestore(m.id);
          }
        }
      });
      showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, options);
    });
    return markerObj;
  }

  // ------------------------------
  // Global Duplicate (Copy) Marker Sticky Behavior
  map.on("mousemove", (ev) => {
    if (duplicatingMarker) {
      duplicatingMarker.setLatLng(ev.latlng);
      pasteTooltip.style.left = (ev.containerPoint.x + 15) + "px";
      pasteTooltip.style.top = (ev.containerPoint.y + 15) + "px";
      pasteTooltip.style.display = "block";
    }
  });
  map.on("click", (ev) => {
    if (duplicatingMarker) {
      duplicatingData.coords = [ev.latlng.lat, ev.latlng.lng];
      updateMarkerInFirestore(duplicatingData);
      duplicatingMarker.dragging.disable();
      duplicatingMarker = null;
      duplicatingData = null;
      pasteTooltip.style.display = "none";
    }
  });
  // Right-click anywhere cancels paste mode
  document.addEventListener("contextmenu", (ev) => {
    if (duplicatingMarker) {
      duplicatingMarker.dragging.disable();
      duplicatingMarker = null;
      duplicatingData = null;
      pasteTooltip.style.display = "none";
    }
  });

  // ------------------------------
  // Load Markers from Firestore (or fallback JSON)
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

  // ------------------------------
  // Right-click on Map -> Create New Marker (Edit Mode)
  map.on("contextmenu", (evt) => {
    showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [
      {
        text: "Create New Marker",
        action: () => {
          currentEditMarker = null;
          editName.value = "";
          pickrName.setColor("#ffffff");
          editType.value = "Door";
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
          // Hide item-specific sections since default is Door
          itemExtraFields.style.display = "none";
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
  // Basic Search Functionality
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
  // Toggle Marker Grouping (for Item markers)
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

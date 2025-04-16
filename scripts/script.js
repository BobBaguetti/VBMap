// Import the Firestore database instance from our Firebase module.
import { db } from "./scripts/modules/firebase.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Script loaded!");

  // ------------------------------
  // Map Setup
  // ------------------------------
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

  // ------------------------------
  // Layers Setup
  // ------------------------------
  let itemLayer = L.markerClusterGroup();
  const layers = {
    "Door": L.layerGroup(),
    "Extraction Portal": L.layerGroup(),
    "Item": itemLayer,
    "Teleport": L.layerGroup()
  };
  Object.values(layers).forEach(layer => layer.addTo(map));

  // Global container for markers
  let allMarkers = [];

  // ------------------------------
  // Copy-Paste Mode Variables
  // ------------------------------
  let copiedMarkerData = null;
  let pasteMode = false;
  const pasteTooltip = document.getElementById("paste-tooltip");

  // ------------------------------
  // Context Menu Setup
  // ------------------------------
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
        try {
          opt.action();
        } catch (err) {
          console.error("Error executing context menu action:", err);
        }
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
    // Right-click cancels paste mode if active.
    if (pasteMode) {
      cancelPasteMode();
    }
  });

  // ------------------------------
  // Draggable Edit Modal Setup
  // ------------------------------
  const editModal = document.getElementById("edit-modal");
  const editModalHandle = document.getElementById("edit-modal-handle");
  let isDragging = false, modalOffsetX = 0, modalOffsetY = 0;
  if (editModalHandle) {
    editModalHandle.addEventListener("mousedown", (e) => {
      isDragging = true;
      const style = window.getComputedStyle(editModal);
      modalOffsetX = e.clientX - parseInt(style.left, 10);
      modalOffsetY = e.clientY - parseInt(style.top, 10);
      e.preventDefault();
    });
  }
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      editModal.style.left = (e.clientX - modalOffsetX) + "px";
      editModal.style.top = (e.clientY - modalOffsetY) + "px";
    }
  });
  document.addEventListener("mouseup", () => { isDragging = false; });

  // ------------------------------
  // Video Popup Setup
  // ------------------------------
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
  // Edit Modal Fields & Color Picker Setup
  // ------------------------------
  const editForm = document.getElementById("edit-form");
  const editName = document.getElementById("edit-name");
  const editType = document.getElementById("edit-type");
  const editImageSmall = document.getElementById("edit-image-small");
  const editImageBig = document.getElementById("edit-image-big");
  const editVideoURL = document.getElementById("edit-video-url");

  // Helper to create a Pickr instance.
  function createPicker(selector) {
    return Pickr.create({
      el: selector,
      theme: 'nano',
      default: '#E5E6E8',
      components: { 
        preview: true, 
        opacity: true, 
        hue: true, 
        interaction: { hex: true, rgba: true, input: true, save: true } 
      }
    }).on('save', (color, pickr) => {
      pickr.hide();
    });
  }
  const pickrName = createPicker('#pickr-name');

  // Item-specific fields:
  const itemExtraFields = document.getElementById("item-extra-fields");
  const editRarity = document.getElementById("edit-rarity");
  const pickrRarity = createPicker('#pickr-rarity');
  const editItemType = document.getElementById("edit-item-type");
  const pickrItemType = createPicker('#pickr-itemtype');
  const editDescription = document.getElementById("edit-description");
  const pickrDescItem = createPicker('#pickr-desc-item');

  // Non-item description:
  const nonItemDescription = document.getElementById("edit-description-non-item");
  const pickrDescNonItem = createPicker('#pickr-desc-nonitem');

  let currentEditMarker = null;

  // Set default rarity colors.
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

  // Show/hide item fields based on type selection.
  editType.addEventListener("change", () => {
    if (editType.value === "Item") {
      itemExtraFields.style.display = "block";
      nonItemDescription.style.display = "none";
    } else {
      itemExtraFields.style.display = "none";
      nonItemDescription.style.display = "block";
    }
  });

  // Populate the edit modal with marker data.
  function populateEditForm(m) {
    editName.value = m.name || "";
    pickrName.setColor(m.nameColor || "#E5E6E8");
    editType.value = m.type || "Door";
    editImageSmall.value = m.imageSmall || "";
    editImageBig.value = m.imageBig || "";
    editVideoURL.value = m.videoURL || "";
    if (m.type === "Item") {
      itemExtraFields.style.display = "block";
      nonItemDescription.style.display = "none";
      editRarity.value = m.rarity ? m.rarity.toLowerCase() : "";
      pickrRarity.setColor(m.rarityColor || "#E5E6E8");
      editItemType.value = m.itemType || "Crafting Material";
      pickrItemType.setColor(m.itemTypeColor || "#E5E6E8");
      editDescription.value = m.description || "";
      pickrDescItem.setColor(m.descriptionColor || "#E5E6E8");
      extraLines = m.extraLines ? JSON.parse(JSON.stringify(m.extraLines)) : [];
      renderExtraLines();
    } else {
      itemExtraFields.style.display = "none";
      nonItemDescription.style.display = "block";
      nonItemDescription.value = m.description || "";
      pickrDescNonItem.setColor(m.descriptionColor || "#E5E6E8");
    }
  }

  // ------------------------------
  // Extra Info Fields Logic
  // ------------------------------
  let extraLines = [];
  const extraLinesContainer = document.getElementById("extra-lines");
  document.getElementById("add-extra-line").addEventListener("click", () => {
    extraLines.push({ text: "", color: "#E5E6E8" });
    renderExtraLines();
  });
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
      // Create Pickr instance for this extra info field.
      const linePickr = Pickr.create({
        el: colorDiv,
        theme: 'nano',
        default: lineObj.color || "#E5E6E8",
        components: {
          preview: true,
          opacity: true,
          hue: true,
          interaction: { hex: true, rgba: true, input: true, save: true }
        }
      })
      .on('change', (color) => {
        extraLines[idx].color = color.toHEXA().toString();
      })
      .on('save', (color, pickr) => {
        pickr.hide();
      });
      linePickr.setColor(lineObj.color || "#E5E6E8");
    });
  }

  // ------------------------------
  // Cancel and Save Edit Modal
  // ------------------------------
  document.getElementById("edit-cancel").addEventListener("click", () => {
    editModal.style.display = "none";
    currentEditMarker = null;
    extraLines = [];
  });
  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentEditMarker) return;
    const data = currentEditMarker.data;
    data.name = editName.value;
    data.nameColor = pickrName.getColor()?.toHEXA()?.toString() || "#E5E6E8";
    data.type = editType.value;
    data.imageSmall = editImageSmall.value;
    data.imageBig = editImageBig.value;
    data.videoURL = editVideoURL.value || "";
    if (data.type === "Item") {
      data.rarity = formatRarity(editRarity.value);
      data.rarityColor = pickrRarity.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      data.itemType = editItemType.value;
      data.itemTypeColor = pickrItemType.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      data.description = editDescription.value;
      data.descriptionColor = pickrDescItem.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      data.extraLines = JSON.parse(JSON.stringify(extraLines));
    } else {
      data.description = nonItemDescription.value;
      data.descriptionColor = pickrDescNonItem.getColor()?.toHEXA()?.toString() || "#E5E6E8";
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
  function formatRarity(val) {
    if (!val) return "";
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
  }

  // ------------------------------
  // Marker Creation & Popups
  // ------------------------------
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
        itemTypeHTML = `<div style="font-size:16px; color:${m.itemTypeColor||"#E5E6E8"}; margin:2px 0;">${m.itemType}</div>`;
      }
      if (m.rarity) {
        rarityHTML = `<div style="font-size:16px; color:${m.rarityColor||"#E5E6E8"}; margin:2px 0;">${formatRarity(m.rarity)}</div>`;
      }
      if (m.description) {
        descHTML = `<p style="margin:5px 0; color:${m.descriptionColor||"#E5E6E8"};">${m.description}</p>`;
      }
      if (m.extraLines && m.extraLines.length) {
        m.extraLines.forEach(line => {
          extraHTML += `<p style="margin-top:5px; margin-bottom:0; color:${line.color||"#E5E6E8"};">${line.text}</p>`;
        });
      }
    } else {
      if (m.description) {
        descHTML = `<p style="margin:5px 0; color:${m.descriptionColor||"#E5E6E8"};">${m.description}</p>`;
      }
    }
    const nameHTML = `<h3 style="margin:0; font-size:20px; color:${m.nameColor||"#E5E6E8"};">${m.name}</h3>`;
    const scaledImg = m.imageBig 
      ? `<img src="${m.imageBig}" style="width:64px; height:64px; object-fit:contain; border:2px solid #777; border-radius:4px;" />`
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
  
    // Right-click on marker: show context menu.
    markerObj.on("contextmenu", (evt) => {
      evt.originalEvent.preventDefault();
      const options = [
        {
          text: "Edit Marker",
          action: () => {
            currentEditMarker = { markerObj, data: m };
            populateEditForm(m);
            setEditModalPosition(evt.originalEvent);
            editModal.style.display = "block";
          }
        },
        {
          text: "Copy Marker",
          action: () => {
            // Store marker data, remove id so new markers are created, activate paste mode.
            copiedMarkerData = JSON.parse(JSON.stringify(m));
            delete copiedMarkerData.id;
            pasteMode = true;
            pasteTooltip.style.display = "block";
            pasteTooltip.innerText = "Paste Mode Active";
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
      options.push({
        text: "Delete Marker",
        action: () => {
          layers[m.type].removeLayer(markerObj);
          const idx = allMarkers.findIndex(o => o.data.id === m.id);
          if (idx !== -1) allMarkers.splice(idx, 1);
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
  // Firestore: Save and Delete Functions
  // ------------------------------
  function updateMarkerInFirestore(m) {
    if (m.id) {
      db.collection("markers").doc(m.id).set(m)
        .then(() => { console.log("Updated marker:", m.id); })
        .catch(console.error);
    } else {
      db.collection("markers").add(m)
        .then(docRef => {
          m.id = docRef.id;
          console.log("Added marker with ID:", docRef.id);
        })
        .catch(console.error);
    }
  }
  
  function deleteMarkerInFirestore(id) {
    db.collection("markers").doc(id).delete()
      .then(() => { console.log("Deleted marker:", id); })
      .catch(console.error);
  }
  
  // ------------------------------
  // Load Markers from Firestore (or fallback to local JSON)
  // ------------------------------
  function loadMarkers() {
    db.collection("markers").get()
      .then(querySnapshot => {
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
      })
      .catch(err => {
        console.error("Error loading markers from Firestore:", err);
        // Optionally, fallback to local JSON if necessary.
        fetch("./data/markerData.json")
          .then(resp => { if (!resp.ok) throw new Error("Network response was not ok"); return resp.json(); })
          .then(jsonData => {
            jsonData.forEach(m => {
              if (!m.type || !layers[m.type]) {
                console.error(`Invalid marker type: ${m.type}`);
                return;
              }
              addMarker(m);
            });
          })
          .catch(err2 => console.error("Error loading local JSON:", err2));
      });
  }
  loadMarkers();
  
  // ------------------------------
  // Map Right-click (Context Menu for New Marker)
  // ------------------------------
  map.on("contextmenu", (evt) => {
    showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [
      {
        text: "Create New Marker",
        action: () => {
          currentEditMarker = null;
          editName.value = "";
          pickrName.setColor("#E5E6E8");
          editType.value = "Door";
          editImageSmall.value = "";
          editImageBig.value = "";
          editVideoURL.value = "";
          editRarity.value = "";
          pickrRarity.setColor("#E5E6E8");
          editItemType.value = "Crafting Material";
          pickrItemType.setColor("#E5E6E8");
          editDescription.value = "";
          pickrDescItem.setColor("#E5E6E8");
          extraLines = [];
          renderExtraLines();
          itemExtraFields.style.display = "none";
          nonItemDescription.style.display = "none";
          setEditModalPosition(evt.originalEvent);
          editModal.style.display = "block";
  
          editForm.onsubmit = (e2) => {
            e2.preventDefault();
            const newMarker = {
              type: editType.value,
              name: editName.value || "New Marker",
              nameColor: pickrName.getColor()?.toHEXA()?.toString() || "#E5E6E8",
              coords: [evt.latlng.lat, evt.latlng.lng],
              imageSmall: editImageSmall.value,
              imageBig: editImageBig.value,
              videoURL: editVideoURL.value || ""
            };
            if (newMarker.type === "Item") {
              newMarker.rarity = formatRarity(editRarity.value);
              newMarker.rarityColor = pickrRarity.getColor()?.toHEXA()?.toString() || "#E5E6E8";
              newMarker.itemType = editItemType.value;
              newMarker.itemTypeColor = pickrItemType.getColor()?.toHEXA()?.toString() || "#E5E6E8";
              newMarker.description = editDescription.value;
              newMarker.descriptionColor = pickrDescItem.getColor()?.toHEXA()?.toString() || "#E5E6E8";
              newMarker.extraLines = JSON.parse(JSON.stringify(extraLines));
            } else {
              newMarker.description = nonItemDescription.value;
              newMarker.descriptionColor = pickrDescNonItem.getColor()?.toHEXA()?.toString() || "#E5E6E8";
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
  // Position Edit Modal Helper
  // ------------------------------
  function setEditModalPosition(ev) {
    editModal.style.display = "block";
    const modalWidth = editModal.offsetWidth;
    const modalHeight = editModal.offsetHeight;
    editModal.style.left = (ev.pageX - modalWidth + 10) + "px";
    editModal.style.top = (ev.pageY - (modalHeight / 2)) + "px";
  }
  
  // ------------------------------
  // Copy-Paste (Marker Duplication) Logic
  // ------------------------------
  // Listen for left-click on the map to paste markers if paste mode is active.
  map.on("click", (evt) => {
    if (copiedMarkerData) {
      const newMarkerData = JSON.parse(JSON.stringify(copiedMarkerData));
      // Remove any existing id so that Firestore creates a new record.
      delete newMarkerData.id;
      newMarkerData.coords = [evt.latlng.lat, evt.latlng.lng];
      newMarkerData.name = newMarkerData.name + " (copy)";
      addMarker(newMarkerData);
      updateMarkerInFirestore(newMarkerData);
      // Update tooltip position.
      pasteTooltip.style.left = `${evt.containerPoint.x + 15}px`;
      pasteTooltip.style.top = `${evt.containerPoint.y + 15}px`;
    }
  });
  // Right-click anywhere cancels paste mode.
  document.addEventListener("contextmenu", (ev) => {
    if (copiedMarkerData) {
      copiedMarkerData = null;
      pasteTooltip.style.display = "none";
    }
  });
  
  // ------------------------------
  // Search Functionality
  // ------------------------------
  searchBar.addEventListener("input", function() {
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
  // Sidebar Toggle Functionality
  // ------------------------------
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("hidden");
    document.getElementById("map").style.marginLeft = sidebar.classList.contains("hidden") ? "0" : "300px";
    map.invalidateSize();
  });
});

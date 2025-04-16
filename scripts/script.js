// scripts/script.js
import { initializeMap } from "./modules/map.js";
import { makeDraggable, showContextMenu, hideContextMenu, positionModal, attachContextMenuHider, attachRightClickCancel } from "./modules/uiManager.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Script loaded!");

  // --------------------------------------
  // DOM Elements
  // --------------------------------------
  const searchBar = document.getElementById("search-bar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");
  const editModal = document.getElementById("edit-modal");
  const editModalHandle = document.getElementById("edit-modal-handle");
  const editForm = document.getElementById("edit-form");
  const editName = document.getElementById("edit-name");
  const editType = document.getElementById("edit-type");
  const editImageSmall = document.getElementById("edit-image-small");
  const editImageBig = document.getElementById("edit-image-big");
  const editVideoURL = document.getElementById("edit-video-url");
  const itemExtraFields = document.getElementById("item-extra-fields");
  const editRarity = document.getElementById("edit-rarity");
  const editItemType = document.getElementById("edit-item-type");
  const editDescription = document.getElementById("edit-description");
  const nonItemDescription = document.getElementById("edit-description-non-item");
  const extraLinesContainer = document.getElementById("extra-lines");

  // --------------------------------------
  // Firebase Firestore Initialization
  // --------------------------------------
  const firebaseConfig = {
    apiKey: "AIzaSyDwEdPN5MB8YAuM_jb0K1iXfQ-tGQ",
    authDomain: "vbmap-cc834.firebaseapp.com",
    projectId: "vbmap-cc834",
    storageBucket: "vbmap-cc834.firebasestorage.app",
    messagingSenderId: "244112699360",
    appId: "1:244112699360:web:95f50adb6e10b438238585",
    measurementId: "G-7FDNWLRM95"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // --------------------------------------
  // Map Initialization (using module)
  // --------------------------------------
  const { map, bounds } = initializeMap();

  // --------------------------------------
  // Layers Setup
  // --------------------------------------
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

  // --------------------------------------
  // Copy-Paste Mode Variables
  // --------------------------------------
  let copiedMarkerData = null;
  let pasteMode = false;

  function cancelPasteMode() {
    pasteMode = false;
    copiedMarkerData = null;
  }

  // Attach global UI listeners for context menu hiding and right-click cancellation
  attachContextMenuHider();
  attachRightClickCancel(cancelPasteMode);

  // --------------------------------------
  // Draggable Edit Modal
  // --------------------------------------
  makeDraggable(editModal, editModalHandle);

  // --------------------------------------
  // Video Popup Setup
  // --------------------------------------
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

  // --------------------------------------
  // Edit Modal Fields & Color Picker Setup
  // --------------------------------------
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
  const pickrRarity = createPicker('#pickr-rarity');
  const pickrItemType = createPicker('#pickr-itemtype');
  const pickrDescItem = createPicker('#pickr-desc-item');
  const pickrDescNonItem = createPicker('#pickr-desc-nonitem');

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

  editType.addEventListener("change", () => {
    if (editType.value === "Item") {
      itemExtraFields.style.display = "block";
      nonItemDescription.style.display = "none";
    } else {
      itemExtraFields.style.display = "none";
      nonItemDescription.style.display = "block";
    }
  });

  let currentEditMarker = null;

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

  let extraLines = [];
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

  // --------------------------------------
  // Marker Creation & Popups
  // --------------------------------------
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
        itemTypeHTML = `<div style="font-size:16px; color:${m.itemTypeColor || "#E5E6E8"}; margin:2px 0;">${m.itemType}</div>`;
      }
      if (m.rarity) {
        rarityHTML = `<div style="font-size:16px; color:${m.rarityColor || "#E5E6E8"}; margin:2px 0;">${formatRarity(m.rarity)}</div>`;
      }
      if (m.description) {
        descHTML = `<p style="margin:5px 0; color:${m.descriptionColor || "#E5E6E8"};">${m.description}</p>`;
      }
      if (m.extraLines && m.extraLines.length) {
        m.extraLines.forEach(line => {
          extraHTML += `<p style="margin-top:5px; margin-bottom:0; color:${line.color || "#E5E6E8"};">${line.text}</p>`;
        });
      }
    } else {
      if (m.description) {
        descHTML = `<p style="margin:5px 0; color:${m.descriptionColor || "#E5E6E8"};">${m.description}</p>`;
      }
    }

    const nameHTML = `<h3 style="margin:0; font-size:20px; color:${m.nameColor || "#E5E6E8"};">${m.name}</h3>`;
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
            positionModal(editModal, evt.originalEvent);
            editModal.style.display = "block";
          }
        },
        {
          text: "Copy Marker",
          action: () => {
            copiedMarkerData = JSON.parse(JSON.stringify(m));
            delete copiedMarkerData.id;
            pasteMode = true;
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
        },
        {
          text: "Delete Marker",
          action: () => {
            layers[m.type].removeLayer(markerObj);
            const idx = allMarkers.findIndex(o => o.data.id === m.id);
            if (idx !== -1) allMarkers.splice(idx, 1);
            if (m.id) {
              deleteMarkerInFirestore(m.id);
            }
          }
        }
      ];
      showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, options);
    });

    return markerObj;
  }

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
          if (!data.coords) data.coords = [1500, 1500];
          addMarker(data);
        });
      })
      .catch(err => {
        console.error("Error loading markers from Firestore:", err);
        fetch("./data/markerData.json")
          .then(resp => {
            if (!resp.ok) throw new Error("Network response was not ok");
            return resp.json();
          })
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

  // Right-click on the map to show the "Create New Marker" context menu.
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
          positionModal(editModal, evt.originalEvent);
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

  function setEditModalPosition(ev) {
    editModal.style.display = "block";
    const modalWidth = editModal.offsetWidth;
    const modalHeight = editModal.offsetHeight;
    editModal.style.left = (ev.pageX - modalWidth + 10) + "px";
    editModal.style.top = (ev.pageY - (modalHeight / 2)) + "px";
  }

  // Copy-paste logic: allow repeated pasting while paste mode is active.
  map.on("click", (evt) => {
    if (copiedMarkerData && pasteMode) {
      const newMarkerData = JSON.parse(JSON.stringify(copiedMarkerData));
      delete newMarkerData.id;
      newMarkerData.coords = [evt.latlng.lat, evt.latlng.lng];
      newMarkerData.name = newMarkerData.name + " (copy)";
      addMarker(newMarkerData);
      updateMarkerInFirestore(newMarkerData);
    }
  });

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

  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("hidden");
    document.getElementById("map").style.marginLeft = sidebar.classList.contains("hidden") ? "0" : "300px";
    map.invalidateSize();
  });
});

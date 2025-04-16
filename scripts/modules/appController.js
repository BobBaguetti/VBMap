// scripts/modules/appController.js

import { initializeMap } from "./map.js";
import { 
  initializeFirebase, 
  loadMarkers, 
  addMarker as firebaseAddMarker, 
  updateMarker as firebaseUpdateMarker, 
  deleteMarker as firebaseDeleteMarker 
} from "./firebaseService.js";
import { createMarker, createPopupContent } from "./markerManager.js";
import { 
  makeDraggable, 
  showContextMenu, 
  positionModal, 
  attachContextMenuHider, 
  attachRightClickCancel 
} from "./uiManager.js";
import { formatRarity } from "./utils.js";

export async function bootstrapApp() {
  console.log("Bootstrapping Application...");

  // --- DOM Elements ---
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
  const videoPopup = document.getElementById("video-popup");
  const videoPlayer = document.getElementById("video-player");
  const videoSource = document.getElementById("video-source");

  // --- Firebase Initialization ---
  const firebaseConfig = {
    apiKey: "AIzaSyDwEdPN5MB8YAuM_jb0K1iXfQ-tGQ",
    authDomain: "vbmap-cc834.firebaseapp.com",
    projectId: "vbmap-cc834",
    storageBucket: "vbmap-cc834.firebasestorage.app",
    messagingSenderId: "244112699360",
    appId: "1:244112699360:web:95f50adb6e10b438238585",
    measurementId: "G-7FDNWLRM95"
  };
  const db = initializeFirebase(firebaseConfig);

  // --- Map Initialization ---
  const { map, bounds } = initializeMap();

  // --- Layers Setup ---
  let itemLayer = L.markerClusterGroup();
  const layers = {
    "Door": L.layerGroup(),
    "Extraction Portal": L.layerGroup(),
    "Item": itemLayer,
    "Teleport": L.layerGroup()
  };
  Object.values(layers).forEach((layer) => layer.addTo(map));

  // In-memory markers collection
  let allMarkers = [];

  // --- Copy-Paste Mode Variables ---
  let copiedMarkerData = null;
  let pasteMode = false;
  function cancelPasteMode() {
    pasteMode = false;
    copiedMarkerData = null;
  }
  attachContextMenuHider();
  attachRightClickCancel(cancelPasteMode);

  // --- Draggable Edit Modal ---
  makeDraggable(editModal, editModalHandle);

  // --- Video Popup Setup ---
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

  // --- Extra Lines Setup ---
  let extraLines = [];
  function renderExtraLines() {
    extraLinesContainer.innerHTML = "";
    extraLines.forEach((lineObj, idx) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.style.marginBottom = "5px";
      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.value = lineObj.text;
      textInput.addEventListener("input", () => { extraLines[idx].text = textInput.value; });
      row.appendChild(textInput);
      extraLinesContainer.appendChild(row);
    });
  }
  document.getElementById("add-extra-line").addEventListener("click", () => {
    extraLines.push({ text: "", color: "#E5E6E8" });
    renderExtraLines();
  });

  function populateEditForm(m) {
    editName.value = m.name || "";
    editType.value = m.type || "Door";
    editImageSmall.value = m.imageSmall || "";
    editImageBig.value = m.imageBig || "";
    editVideoURL.value = m.videoURL || "";
    if (m.type === "Item") {
      itemExtraFields.style.display = "block";
      nonItemDescription.style.display = "none";
      editRarity.value = m.rarity ? m.rarity.toLowerCase() : "";
      editItemType.value = m.itemType || "Crafting Material";
      editDescription.value = m.description || "";
      extraLines = m.extraLines ? JSON.parse(JSON.stringify(m.extraLines)) : [];
      renderExtraLines();
    } else {
      itemExtraFields.style.display = "none";
      nonItemDescription.style.display = "block";
      nonItemDescription.value = m.description || "";
    }
  }

  // --- Marker Action Callbacks ---
  let currentEditMarker = null;
  function handleEdit(markerObj, m, evt) {
    currentEditMarker = { markerObj, data: m };
    populateEditForm(m);
    positionModal(editModal, evt);
    editModal.style.display = "block";
  }
  function handleCopy(markerObj, m, evt) {
    copiedMarkerData = JSON.parse(JSON.stringify(m));
    delete copiedMarkerData.id;
    pasteMode = true;
  }
  function handleDragEnd(markerObj, m) {
    firebaseUpdateMarker(db, m);
  }
  function handleDelete(markerObj, m) {
    layers[m.type].removeLayer(markerObj);
    const idx = allMarkers.findIndex(o => o.data.id === m.id);
    if (idx !== -1) allMarkers.splice(idx, 1);
    if (m.id) {
      firebaseDeleteMarker(db, m.id);
    }
  }

  // --- Marker Creation Wrapper ---
  function createMarkerWrapper(m, callbacks) {
    const markerObj = createMarker(m, map, layers, showContextMenu, callbacks);
    allMarkers.push({ markerObj, data: m });
    return markerObj;
  }
  function addMarkerWrapper(m, callbacks = {}) {
    return createMarkerWrapper(m, callbacks);
  }

  // --- Unified Submit Handler for Edit Modal ---
  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const updatedData = {
      name: editName.value,
      nameColor: "#E5E6E8", // update here with actual color data if available
      type: editType.value,
      imageSmall: editImageSmall.value,
      imageBig: editImageBig.value,
      videoURL: editVideoURL.value || ""
    };
    if (editType.value === "Item") {
      updatedData.rarity = formatRarity(editRarity.value);
      updatedData.itemType = editItemType.value;
      updatedData.description = editDescription.value;
      updatedData.extraLines = JSON.parse(JSON.stringify(extraLines));
    } else {
      updatedData.description = nonItemDescription.value;
    }

    if (currentEditMarker) {
      // Editing existing marker
      currentEditMarker.markerObj.setPopupContent(createPopupContent(updatedData));
      firebaseUpdateMarker(db, { ...currentEditMarker.data, ...updatedData });
      currentEditMarker.data = { ...currentEditMarker.data, ...updatedData };
    } else {
      // Creating a new marker (should not happen here since new marker submission is handled in context menu)
      addMarkerWrapper(updatedData, {
        onEdit: handleEdit,
        onCopy: handleCopy,
        onDragEnd: handleDragEnd,
        onDelete: handleDelete
      });
      firebaseAddMarker(db, updatedData);
    }
    editModal.style.display = "none";
  });

  // --- Cancel Button Handler ---
  document.getElementById("edit-cancel").addEventListener("click", () => {
    console.log("Cancel button clicked");
    editModal.style.display = "none";
    currentEditMarker = null;
    extraLines = [];
  });

  // --- Load Markers from Firebase ---
  async function loadAndDisplayMarkers() {
    try {
      const markers = await loadMarkers(db);
      markers.forEach(m => {
        if (!m.type || !layers[m.type]) {
          console.error(`Invalid marker type: ${m.type}`);
          return;
        }
        if (!m.coords) m.coords = [1500, 1500];
        addMarkerWrapper(m, {
          onEdit: handleEdit,
          onCopy: handleCopy,
          onDragEnd: handleDragEnd,
          onDelete: handleDelete
        });
      });
    } catch (err) {
      console.error("Error loading markers:", err);
    }
  }
  loadAndDisplayMarkers();

  // --- Right-Click (Context Menu) for New Marker ---
  map.on("contextmenu", (evt) => {
    showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [
      {
        text: "Create New Marker",
        action: () => {
          currentEditMarker = null;
          editName.value = "";
          editType.value = "Door";
          editImageSmall.value = "";
          editImageBig.value = "";
          editVideoURL.value = "";
          editRarity.value = "";
          editItemType.value = "Crafting Material";
          editDescription.value = "";
          extraLines = [];
          renderExtraLines();
          itemExtraFields.style.display = "none";
          nonItemDescription.style.display = "none";
          positionModal(editModal, evt.originalEvent);
          editModal.style.display = "block";
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

  // --- Paste Mode for Copy Marker ---
  map.on("click", (evt) => {
    if (copiedMarkerData && pasteMode) {
      const newMarkerData = JSON.parse(JSON.stringify(copiedMarkerData));
      delete newMarkerData.id;
      newMarkerData.coords = [evt.latlng.lat, evt.latlng.lng];
      newMarkerData.name = newMarkerData.name + " (copy)";
      addMarkerWrapper(newMarkerData, {
        onEdit: handleEdit,
        onCopy: handleCopy,
        onDragEnd: handleDragEnd,
        onDelete: handleDelete
      });
      firebaseAddMarker(db, newMarkerData);
    }
  });

  // --- Search Functionality ---
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

  // --- Sidebar Toggle ---
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("hidden");
    document.getElementById("map").style.marginLeft = sidebar.classList.contains("hidden") ? "0" : "300px";
    map.invalidateSize();
  });
}

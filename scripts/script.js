// scripts/script.js

import { initializeMap } from "./modules/map.js";
import { 
  makeDraggable, 
  showContextMenu, 
  positionModal, 
  attachContextMenuHider, 
  attachRightClickCancel 
} from "./modules/uiManager.js";
import { 
  initializeFirebase, 
  loadMarkers, 
  addMarker as firebaseAddMarker, 
  updateMarker as firebaseUpdateMarker, 
  deleteMarker as firebaseDeleteMarker 
} from "./modules/firebaseService.js";
import { createMarker, createPopupContent } from "./modules/markerManager.js";
import { formatRarity } from "./modules/utils.js";
import { loadItemDefinitions } from "./modules/itemDefinitions.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Script loaded!");

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

  // Admin Tools Elements (Sidebar)
  const itemDefinitionSelect = document.getElementById("item-definition-select");
  // Predefined items selector in the edit modal
  const itemDefinitionSelectEdit = document.getElementById("item-definition-select-edit");
  // Button for adding new definitions (future use)
  const addItemDefinitionButton = document.getElementById("add-item-definition");

  // --- Video Popup Elements ---
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
  const { map } = initializeMap();

  // --- Layers Setup ---
  let itemLayer = L.markerClusterGroup();
  const layers = {
    "Door": L.layerGroup(),
    "Extraction Portal": L.layerGroup(),
    "Item": itemLayer,
    "Teleport": L.layerGroup()
  };
  Object.values(layers).forEach(layer => layer.addTo(map));
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
      pickrRarity.setColor(m.rarityColor || "#E5E6E8");
      editItemType.value = m.itemType || "Crafting Material";
      pickrItemType.setColor(m.itemTypeColor || "#E5E6E8");
      editDescription.value = m.description || "";
      pickrDescItem.setColor(m.descriptionColor || "#E5E6E8");
      extraLines = m.extraLines ? JSON.parse(JSON.stringify(m.extraLines)) : [];
      renderExtraLines();
      if (m.definitionId && itemDefinitionSelectEdit) {
        itemDefinitionSelectEdit.value = m.definitionId;
      }
    } else {
      itemExtraFields.style.display = "none";
      nonItemDescription.style.display = "block";
      nonItemDescription.value = m.description || "";
      pickrDescNonItem.setColor(m.descriptionColor || "#E5E6E8");
    }
  }

  // --- Admin Tools: Load and Populate Item Definitions ---
  async function loadAndPopulateItemDefinitions() {
    try {
      const defs = await loadItemDefinitions(db);
      // Populate sidebar dropdown.
      itemDefinitionSelect.innerHTML = `<option value="">-- Select Item Definition --</option>`;
      defs.forEach(def => {
        const opt = document.createElement("option");
        opt.value = def.id;
        opt.textContent = def.name;
        itemDefinitionSelect.appendChild(opt);
      });
      // Populate edit modal dropdown.
      if (itemDefinitionSelectEdit) {
        itemDefinitionSelectEdit.innerHTML = `<option value="">-- Select Item Definition --</option>`;
        defs.forEach(def => {
          const opt = document.createElement("option");
          opt.value = def.id;
          opt.textContent = def.name;
          itemDefinitionSelectEdit.appendChild(opt);
        });
      }
    } catch (err) {
      console.error("Error loading item definitions:", err);
    }
  }
  loadAndPopulateItemDefinitions();

  // Auto-fill fields in edit modal when a predefined item is selected.
  if (itemDefinitionSelectEdit) {
    itemDefinitionSelectEdit.addEventListener("change", (e) => {
      const selectedId = e.target.value;
      if (selectedId) {
        loadItemDefinitions(db).then(defs => {
          const def = defs.find(d => d.id === selectedId);
          if (def) {
            editName.value = def.name;
            editItemType.value = def.itemType;
            editDescription.value = def.description;
            editRarity.value = def.rarity;
            // Optionally update color pickers here.
          }
        }).catch(err => console.error(err));
      }
    });
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

  function createMarkerWrapper(m, callbacks) {
    const markerObj = createMarker(m, map, layers, showContextMenu, callbacks);
    allMarkers.push({ markerObj, data: m });
    return markerObj;
  }
  function addMarkerWrapper(m, callbacks = {}) {
    return createMarkerWrapper(m, callbacks);
  }

  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const updatedData = {
      name: editName.value,
      nameColor: "#E5E6E8",
      type: editType.value,
      imageSmall: editImageSmall.value,
      imageBig: editImageBig.value,
      videoURL: editVideoURL.value || ""
    };
    if (editType.value === "Item") {
      updatedData.rarity = formatRarity(editRarity.value);
      updatedData.rarityColor = pickrRarity.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      updatedData.itemType = editItemType.value;
      updatedData.itemTypeColor = pickrItemType.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      updatedData.description = editDescription.value;
      updatedData.descriptionColor = pickrDescItem.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      updatedData.extraLines = JSON.parse(JSON.stringify(extraLines));
      updatedData.definitionId = itemDefinitionSelectEdit ? itemDefinitionSelectEdit.value : "";
    } else {
      updatedData.description = nonItemDescription.value;
      updatedData.descriptionColor = pickrDescNonItem.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      delete updatedData.rarity;
      delete updatedData.rarityColor;
      delete updatedData.itemType;
      delete updatedData.itemTypeColor;
      delete updatedData.extraLines;
    }
    if (currentEditMarker) {
      currentEditMarker.markerObj.setPopupContent(createPopupContent(updatedData));
      firebaseUpdateMarker(db, { ...currentEditMarker.data, ...updatedData });
      currentEditMarker.data = { ...currentEditMarker.data, ...updatedData };
    } else {
      updatedData.coords = [1500, 1500];
      addMarkerWrapper(updatedData, {
        onEdit: handleEdit,
        onCopy: handleCopy,
        onDragEnd: handleDragEnd,
        onDelete: handleDelete
      });
      firebaseAddMarker(db, updatedData);
    }
    editModal.style.display = "none";
    currentEditMarker = null;
    extraLines = [];
  });

  document.getElementById("edit-cancel").addEventListener("click", () => {
    editModal.style.display = "none";
    currentEditMarker = null;
    extraLines = [];
  });

  async function loadAndDisplayMarkers() {
    try {
      const markers = await loadMarkers(db);
      markers.forEach(m => {
        if (!m.type || !layers[m.type]) return;
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
          // Optional: Clear predefined item selector value for new marker.
          if (itemDefinitionSelectEdit) itemDefinitionSelectEdit.value = "";
        }
      }
    ]);
  });

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

  searchBar.addEventListener("input", function () {
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

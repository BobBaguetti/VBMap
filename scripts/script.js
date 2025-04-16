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
import { loadItemDefinitions } from "./modules/itemDefinitionsService.js";
import { initItemDefinitionsUI } from "./modules/itemDefinitionsUI.js";

let predefinedItemDefs = {};

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Script loaded!");

  // ------------------------------
  // DOM Elements
  // ------------------------------
  const searchBar           = document.getElementById("search-bar");
  const sidebarToggle       = document.getElementById("sidebar-toggle");
  const sidebar             = document.getElementById("sidebar");
  const editModal           = document.getElementById("edit-modal");
  const editModalHandle     = document.getElementById("edit-modal-handle");
  const editForm            = document.getElementById("edit-form");
  const editName            = document.getElementById("edit-name");
  const editType            = document.getElementById("edit-type");
  const editImageSmall      = document.getElementById("edit-image-small");
  const editImageBig        = document.getElementById("edit-image-big");
  const editVideoURL        = document.getElementById("edit-video-url");
  const itemExtraFields     = document.getElementById("item-extra-fields");
  const editRarity          = document.getElementById("edit-rarity");
  const editItemType        = document.getElementById("edit-item-type");
  const editDescription     = document.getElementById("edit-description");
  const nonItemDescription  = document.getElementById("edit-description-non-item");
  const extraLinesContainer = document.getElementById("extra-lines");
  const predefinedItemContainer  = document.getElementById("predefined-item-container");
  const predefinedItemDropdown   = document.getElementById("predefined-item-dropdown");

  // ------------------------------
  // Firebase Initialization
  // ------------------------------
  const firebaseConfig = {
    apiKey: "…",
    authDomain: "…",
    projectId: "…",
    storageBucket: "…",
    messagingSenderId: "…",
    appId: "…",
    measurementId: "…"
  };
  const db = initializeFirebase(firebaseConfig);

  // ------------------------------
  // Initialize Item‑Definitions UI
  // ------------------------------
  initItemDefinitionsUI(db, populatePredefinedItemsDropdown);

  // ------------------------------
  // Map Initialization
  // ------------------------------
  const { map, bounds } = initializeMap();

  // ------------------------------
  // Layers Setup
  // ------------------------------
  const itemLayer = L.markerClusterGroup();
  const layers = {
    Door: L.layerGroup(),
    "Extraction Portal": L.layerGroup(),
    Item: itemLayer,
    Teleport: L.layerGroup()
  };
  Object.values(layers).forEach((lyr) => lyr.addTo(map));

  // In-memory markers
  let allMarkers = [];

  // ------------------------------
  // Copy‑Paste Mode
  // ------------------------------
  let copiedMarkerData = null;
  let pasteMode = false;
  function cancelPasteMode() {
    pasteMode = false;
    copiedMarkerData = null;
  }
  attachContextMenuHider();
  attachRightClickCancel(cancelPasteMode);

  // ------------------------------
  // Draggable Edit Modal
  // ------------------------------
  makeDraggable(editModal, editModalHandle);

  // ------------------------------
  // Video Popup
  // ------------------------------
  const videoPopup  = document.getElementById("video-popup");
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
    videoPopup.style.top  = y + "px";
    videoPopup.style.display = "block";
  }
  window.openVideoPopup = openVideoPopup;

  // ------------------------------
  // Color‑Pickers for Edit Modal
  // ------------------------------
  function createPicker(selector) {
    return Pickr.create({
      el: selector,
      theme: 'nano',
      default: '#E5E6E8',
      components: {
        preview: true, opacity: true, hue: true,
        interaction: { hex: true, rgba: true, input: true, save: true }
      }
    }).on('save', (c,p) => p.hide());
  }
  const pickrName        = createPicker('#pickr-name');
  const pickrRarity      = createPicker('#pickr-rarity');
  const pickrItemType    = createPicker('#pickr-itemtype');
  const pickrDescItem    = createPicker('#pickr-desc-item');
  const pickrDescNonItem = createPicker('#pickr-desc-nonitem');

  // ------------------------------
  // Edit‑Form Logic
  // ------------------------------
  let extraLines = [];
  function renderExtraLines() {
    extraLinesContainer.innerHTML = "";
    extraLines.forEach((lineObj, idx) => {
      // …same implementation as before…
    });
  }
  function updateItemFieldsVisibility() {
    if (editType.value === "Item") {
      itemExtraFields.style.display = "block";
      nonItemDescription.style.display = "none";
      predefinedItemContainer.style.display = "block";
      populatePredefinedItemsDropdown();
    } else {
      itemExtraFields.style.display = "none";
      nonItemDescription.style.display = "block";
      predefinedItemContainer.style.display = "none";
    }
  }
  editType.addEventListener("change", updateItemFieldsVisibility);
  predefinedItemDropdown.addEventListener("change", () => {
    // …same implementation as before…
  });
  let currentEditMarker = null;
  function populateEditForm(m) { /* … */ }
  document.getElementById("add-extra-line").addEventListener("click", () => {
    extraLines.push({ text: "", color: "#E5E6E8" });
    renderExtraLines();
  });
  document.getElementById("edit-cancel").addEventListener("click", () => {
    editModal.style.display = "none";
    currentEditMarker = null;
    extraLines = [];
  });
  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    // …update data, firebaseUpdateMarker, etc.…
  });

  // ------------------------------
  // Predefined Items Dropdown
  // ------------------------------
  async function populatePredefinedItemsDropdown() {
    try {
      const defs = await loadItemDefinitions(db);
      predefinedItemDefs = {};
      predefinedItemDropdown.innerHTML = '<option value="">-- Select an item --</option>';
      defs.forEach(def => {
        predefinedItemDefs[def.id] = def;
        const opt = document.createElement("option");
        opt.value = def.id;
        opt.textContent = def.name;
        predefinedItemDropdown.appendChild(opt);
      });
    } catch (err) {
      console.error("Error loading predefined items:", err);
    }
  }

  // ------------------------------
  // Marker Management
  // ------------------------------
  function createMarkerWrapper(m, callbacks) {
    const markerObj = createMarker(m, map, layers, showContextMenu, callbacks);
    allMarkers.push({ markerObj, data: m });
    return markerObj;
  }
  function addMarker(m, callbacks = {}) {
    return createMarkerWrapper(m, callbacks);
  }
  function handleEdit(markerObj, m, evt) { /* … */ }
  function handleCopy(markerObj, m, evt) { /* … */ }
  function handleDragEnd(markerObj, m) { /* … */ }
  function handleDelete(markerObj, m) { /* … */ }

  async function loadAndDisplayMarkers() {
    try {
      const markers = await loadMarkers(db);
      markers.forEach(m => {
        if (!m.type || !layers[m.type]) return;
        if (!m.coords) m.coords = [1500,1500];
        addMarker(m, {
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

  map.on("contextmenu", evt => {
    showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [
      { text: "Create New Marker", action: () => { /* … */ } }
    ]);
  });

  map.on("click", evt => {
    if (copiedMarkerData && pasteMode) {
      // …paste logic…
    }
  });

  searchBar.addEventListener("input", function() {
    const q = this.value.toLowerCase();
    allMarkers.forEach(item => {
      const name = item.data.name.toLowerCase();
      if (name.includes(q)) {
        if (!map.hasLayer(item.data.type)) layers[item.data.type].addLayer(item.markerObj);
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

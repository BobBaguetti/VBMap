// scripts/script.js
import { initializeMap } from "./modules/map.js";
import { attachContextMenuHider, attachRightClickCancel, makeDraggable, positionModal } from "./modules/uiManager.js";
import { initializeFirebase, loadMarkers, addMarker as firebaseAddMarker } from "./modules/firebaseService.js";
import { createPopupContent } from "./modules/markerManager.js";
import { formatRarity } from "./modules/utils.js";
import { initItemDefinitionsManager } from "./modules/itemDefinitionsManager.js";
import { initMarkerInteractions } from "./modules/markerInteractions.js";

// Global variables for copy/paste
let copiedMarkerData = null;
let pasteMode = false;

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Script loaded!");

  // Primary DOM Elements
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
  const predefinedItemContainer = document.getElementById("predefined-item-container");
  const predefinedItemDropdown = document.getElementById("predefined-item-dropdown");

  // Firebase Initialization
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

  // Map Initialization
  const { map, bounds } = initializeMap();

  // Marker Layers
  let itemLayer = L.markerClusterGroup();
  const layers = {
    "Door": L.layerGroup(),
    "Extraction Portal": L.layerGroup(),
    "Item": itemLayer,
    "Teleport": L.layerGroup()
  };
  Object.values(layers).forEach(layer => layer.addTo(map));

  // Attach general UI helpers
  attachContextMenuHider();
  attachRightClickCancel(() => { pasteMode = false; copiedMarkerData = null; });
  makeDraggable(editModal, editModalHandle);

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

  // Marker Edit Modal Pickr Controls
  function createPicker(selector) {
    return Pickr.create({
      el: selector,
      theme: 'nano',
      default: '#E5E6E8',
      components: { preview: true, opacity: true, hue: true, interaction: { hex: true, rgba: true, input: true, save: true } }
    }).on('save', (color, pickr) => {
      pickr.hide();
    });
  }
  const pickrName = createPicker('#pickr-name');
  const pickrRarity = createPicker('#pickr-rarity');
  const pickrItemType = createPicker('#pickr-itemtype');
  const pickrDescItem = createPicker('#pickr-desc-item');
  const pickrDescNonItem = createPicker('#pickr-desc-nonitem');

  // Global functions for marker modal editing.
  function populateEditForm(m) {
    editName.value = m.name || "";
    pickrName.setColor(m.nameColor || "#E5E6E8");
    editType.value = m.type || "Door";
    editImageSmall.value = m.imageSmall || "";
    editImageBig.value = m.imageBig || "";
    editVideoURL.value = m.videoURL || "";
    if (m.type === "Item") {
      predefinedItemDropdown.value = m.predefinedItemId ? m.predefinedItemId : "";
      editRarity.value = m.rarity ? m.rarity.toLowerCase() : "";
      pickrRarity.setColor(m.rarityColor || "#E5E6E8");
      editItemType.value = m.itemType || "Crafting Material";
      pickrItemType.setColor(m.itemTypeColor || "#E5E6E8");
      editDescription.value = m.description || "";
      pickrDescItem.setColor(m.descriptionColor || "#E5E6E8");
    } else {
      nonItemDescription.value = m.description || "";
      pickrDescNonItem.setColor(m.descriptionColor || "#E5E6E8");
    }
  }
  function openEditModal(evt) {
    positionModal(editModal, evt);
    editModal.style.display = "block";
  }
  
  // Marker Interactions Module Setup
  const markerInteractions = initMarkerInteractions(map, layers, (x, y, options) => {
      // Your context menu display function here
  }, {
      populateEditForm,
      openEditModal,
      setCopiedMarkerData: (data) => { copiedMarkerData = data; },
      enablePasteMode: () => { pasteMode = true; }
  });
  markerInteractions.loadAndDisplayMarkers();

  // Context menu event (for creating markers, etc.) and copy/paste handlers remain here (unchanged)
  map.on("contextmenu", (evt) => {
    showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [{
      text: "Create New Marker",
      action: () => {
        // Reset the marker edit form for new marker creation.
        // (Assume that you have similar logic here as in your original code.)
        editName.value = "";
        pickrName.setColor("#E5E6E8");
        editType.value = "Item";
        editImageSmall.value = "";
        editImageBig.value = "";
        editVideoURL.value = "";
        editRarity.value = "";
        pickrRarity.setColor("#E5E6E8");
        editItemType.value = "Crafting Material";
        pickrItemType.setColor("#E5E6E8");
        editDescription.value = "";
        pickrDescItem.setColor("#E5E6E8");
        positionModal(editModal, evt.originalEvent);
        editModal.style.display = "block";
        editForm.onsubmit = (e2) => {
          e2.preventDefault();
          // Create new marker data:
          const newMarker = {
            type: editType.value,
            name: editName.value || "New Marker",
            nameColor: pickrName.getColor()?.toHEXA()?.toString() || "#E5E6E8",
            coords: [evt.latlng.lat, evt.latlng.lng],
            imageSmall: editImageSmall.value,
            imageBig: editImageBig.value,
            videoURL: editVideoURL.value || "",
            predefinedItemId: predefinedItemDropdown.value || null
          };
          if (newMarker.type === "Item") {
            newMarker.rarity = formatRarity(editRarity.value);
            newMarker.rarityColor = pickrRarity.getColor()?.toHEXA()?.toString() || "#E5E6E8";
            newMarker.itemType = editItemType.value;
            newMarker.itemTypeColor = pickrItemType.getColor()?.toHEXA()?.toString() || "#E5E6E8";
            newMarker.description = editDescription.value;
            newMarker.descriptionColor = pickrDescItem.getColor()?.toHEXA()?.toString() || "#E5E6E8";
          } else {
            newMarker.description = nonItemDescription.value;
            newMarker.descriptionColor = pickrDescNonItem.getColor()?.toHEXA()?.toString() || "#E5E6E8";
          }
          addMarker(newMarker, { 
              onEdit: markerInteractions.handleEdit, 
              onCopy: markerInteractions.handleCopy, 
              onDragEnd: markerInteractions.handleDragEnd, 
              onDelete: markerInteractions.handleDelete 
          });
          firebaseAddMarker(newMarker);
          editModal.style.display = "none";
          editForm.onsubmit = null;
        };
      }
    }]);
  });

  map.on("click", (evt) => {
    if (copiedMarkerData && pasteMode) {
      const newMarkerData = JSON.parse(JSON.stringify(copiedMarkerData));
      delete newMarkerData.id;
      newMarkerData.coords = [evt.latlng.lat, evt.latlng.lng];
      newMarkerData.name = newMarkerData.name + " (copy)";
      addMarker(newMarkerData, { 
         onEdit: markerInteractions.handleEdit, 
         onCopy: markerInteractions.handleCopy, 
         onDragEnd: markerInteractions.handleDragEnd, 
         onDelete: markerInteractions.handleDelete 
      });
      firebaseAddMarker(newMarkerData);
    }
  });

  searchBar.addEventListener("input", function() {
    const query = this.value.toLowerCase();
    markerInteractions.getAllMarkers().forEach(item => {
      const markerName = item.data.name.toLowerCase();
      if (markerName.includes(query)) {
        if (!map.hasLayer(item.data.type)) {
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

  // Initialize the Item Definitions modal functionality.
  initItemDefinitionsManager(db);
});

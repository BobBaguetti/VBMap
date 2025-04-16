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
import { initItemDefinitionsUI } from "./modules/itemDefinitionsUI.js";
import { loadItemDefinitions } from "./modules/itemDefinitionsService.js";

// Global storage for predefined item definitions keyed by ID.
let predefinedItemDefs = {};

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Script loaded!");

  // ------------------------------
  // DOM Elements
  // ------------------------------
  const searchBar               = document.getElementById("search-bar");
  const sidebarToggle           = document.getElementById("sidebar-toggle");
  const sidebar                 = document.getElementById("sidebar");
  const editModal               = document.getElementById("edit-modal");
  const editModalHandle         = document.getElementById("edit-modal-handle");
  const editForm                = document.getElementById("edit-form");
  const editName                = document.getElementById("edit-name");
  const editType                = document.getElementById("edit-type");
  const editImageSmall          = document.getElementById("edit-image-small");
  const editImageBig            = document.getElementById("edit-image-big");
  const editVideoURL            = document.getElementById("edit-video-url");
  const itemExtraFields         = document.getElementById("item-extra-fields");
  const editRarity              = document.getElementById("edit-rarity");
  const editItemType            = document.getElementById("edit-item-type");
  const editDescription         = document.getElementById("edit-description");
  const nonItemDescription      = document.getElementById("edit-description-non-item");
  const extraLinesContainer     = document.getElementById("extra-lines");
  const predefinedItemContainer = document.getElementById("predefined-item-container");
  const predefinedItemDropdown  = document.getElementById("predefined-item-dropdown");

  // ------------------------------
  // Firebase Initialization
  // ------------------------------
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

  // ------------------------------
  // Map Initialization
  // ------------------------------
  const { map } = initializeMap();

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
  Object.values(layers).forEach(layer => layer.addTo(map));

  // In-memory markers collection & current marker being edited
  let allMarkers = [];
  let currentEditMarker = null;

  // Extra‐info lines state for marker editing
  let extraLines = [];

  // ------------------------------
  // Helper: renderExtraLines for marker edit modal
  // ------------------------------
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

      row.append(textInput, colorDiv, removeBtn);
      extraLinesContainer.append(row);

      const pickr = Pickr.create({
        el: colorDiv,
        theme: 'nano',
        default: lineObj.color || "#E5E6E8",
        components: {
          preview: true, opacity: true, hue: true,
          interaction: { hex: true, rgba: true, input: true, save: true }
        }
      })
      .on('change', (color) => {
        extraLines[idx].color = color.toHEXA().toString();
      })
      .on('save', (_, p) => p.hide());
    });
  }

  // ------------------------------
  // Helper: populateEditForm for marker edit modal
  // ------------------------------
  function populateEditForm(m) {
    editName.value           = m.name || "";
    pickrName.setColor(m.nameColor || "#E5E6E8");
    editType.value           = m.type || "Door";
    editImageSmall.value     = m.imageSmall || "";
    editImageBig.value       = m.imageBig || "";
    editVideoURL.value       = m.videoURL || "";
    if (m.type === "Item") {
      itemExtraFields.style.display = "block";
      nonItemDescription.style.display = "none";
      editRarity.value        = m.rarity?.toLowerCase() || "";
      pickrRarity.setColor(m.rarityColor || "#E5E6E8");
      editItemType.value      = m.itemType || "Crafting Material";
      pickrItemType.setColor(m.itemTypeColor || "#E5E6E8");
      editDescription.value   = m.description || "";
      pickrDescItem.setColor(m.descriptionColor || "#E5E6E8");
      extraLines              = m.extraLines ? JSON.parse(JSON.stringify(m.extraLines)) : [];
      renderExtraLines();
    } else {
      itemExtraFields.style.display = "none";
      nonItemDescription.style.display = "block";
      nonItemDescription.value = m.description || "";
      pickrDescNonItem.setColor(m.descriptionColor || "#E5E6E8");
    }
  }

  // ------------------------------
  // Copy-Paste Mode Variables
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
  // Video Popup Setup
  // ------------------------------
  const videoPopup   = document.getElementById("video-popup");
  const videoPlayer  = document.getElementById("video-player");
  const videoSource  = document.getElementById("video-source");
  document.getElementById("video-close").addEventListener("click", () => {
    videoPopup.style.display = "none";
    videoPlayer.pause();
  });
  function openVideoPopup(x, y, url) {
    videoSource.src = url;
    videoPlayer.load();
    videoPopup.style.left  = `${x}px`;
    videoPopup.style.top   = `${y}px`;
    videoPopup.style.display = "block";
  }
  window.openVideoPopup = openVideoPopup;

  // ------------------------------
  // Color Picker Setup for Marker Edit Modal
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
    }).on('save', (_, p) => p.hide());
  }
  const pickrName        = createPicker('#pickr-name');
  const pickrRarity      = createPicker('#pickr-rarity');
  const pickrItemType    = createPicker('#pickr-itemtype');
  const pickrDescItem    = createPicker('#pickr-desc-item');
  const pickrDescNonItem = createPicker('#pickr-desc-nonitem');

  // ------------------------------
  // updateItemFieldsVisibility Function
  // ------------------------------
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

  // ------------------------------
  // Predefined Item Dropdown Change Listener
  // ------------------------------
  predefinedItemDropdown.addEventListener("change", () => {
    const sel = predefinedItemDropdown.value;
    if (sel && predefinedItemDefs[sel]) {
      const def = predefinedItemDefs[sel];
      editName.value        = def.name;
      pickrName.setColor(def.nameColor);
      editRarity.value      = def.rarity?.toLowerCase() || "";
      pickrRarity.setColor(def.rarityColor);
      editItemType.value    = def.itemType;
      pickrItemType.setColor(def.itemTypeColor);
      editDescription.value = def.description;
      pickrDescItem.setColor(def.descriptionColor);
      extraLines            = def.extraLines || [];
      renderExtraLines();
      editImageSmall.value  = def.imageSmall;
      editImageBig.value    = def.imageBig;
    }
  });

  // ------------------------------
  // Function to populate predefined items dropdown
  // ------------------------------
  async function populatePredefinedItemsDropdown() {
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
  }

  // ------------------------------
  // Initialize the Item Definitions modal UI
  // ------------------------------
  initItemDefinitionsUI(db);

  // ------------------------------
  // Marker Creation & Management
  // ------------------------------
  function createMarkerWrapper(m, callbacks) {
    const markerObj = createMarker(m, map, layers, showContextMenu, callbacks);
    allMarkers.push({ markerObj, data: m });
    return markerObj;
  }
  function addMarker(m, callbacks={}) { return createMarkerWrapper(m, callbacks); }

  function handleEdit(markerObj, m, evt) {
    currentEditMarker = { markerObj, data: m };
    populateEditForm(m);
    positionModal(editModal, evt);
    editModal.style.display = "block";
  }
  function handleCopy(markerObj, m) {
    copiedMarkerData = JSON.parse(JSON.stringify(m));
    delete copiedMarkerData.id;
    pasteMode = true;
  }
  function handleDragEnd(markerObj, m) {
    firebaseUpdateMarker(db, m);
  }
  function handleDelete(markerObj, m) {
    layers[m.type].removeLayer(markerObj);
    allMarkers = allMarkers.filter(o => o.data.id !== m.id);
    if (m.id) firebaseDeleteMarker(db, m.id);
  }

  async function loadAndDisplayMarkers() {
    const markers = await loadMarkers(db);
    markers.forEach(m => {
      if (!layers[m.type]) return;
      if (!m.coords) m.coords = [1500,1500];
      addMarker(m, { onEdit: handleEdit, onCopy: handleCopy, onDragEnd: handleDragEnd, onDelete: handleDelete });
    });
  }
  loadAndDisplayMarkers();

  map.on("contextmenu", evt => {
    showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [{
      text: "Create New Marker",
      action: () => {
        currentEditMarker = null;
        editName.value = ""; pickrName.setColor("#E5E6E8");
        editType.value = "Item"; updateItemFieldsVisibility();
        editImageSmall.value = ""; editImageBig.value = ""; editVideoURL.value = "";
        editRarity.value = ""; pickrRarity.setColor("#E5E6E8");
        editItemType.value = "Crafting Material"; pickrItemType.setColor("#E5E6E8");
        editDescription.value = ""; pickrDescItem.setColor("#E5E6E8");
        extraLines = []; renderExtraLines();
        positionModal(editModal, evt.originalEvent);
        editModal.style.display = "block";
        editForm.onsubmit = e2 => {
          e2.preventDefault();
          const nm = {
            type: editType.value,
            name: editName.value || "New Marker",
            nameColor: pickrName.getColor().toHEXA().toString(),
            coords: [evt.latlng.lat, evt.latlng.lng],
            imageSmall: editImageSmall.value,
            imageBig: editImageBig.value,
            videoURL: editVideoURL.value || "",
            predefinedItemId: predefinedItemDropdown.value || null
          };
          if (nm.type==="Item") {
            nm.rarity = formatRarity(editRarity.value);
            nm.rarityColor = pickrRarity.getColor().toHEXA().toString();
            nm.itemType = editItemType.value;
            nm.itemTypeColor = pickrItemType.getColor().toHEXA().toString();
            nm.description = editDescription.value;
            nm.descriptionColor = pickrDescItem.getColor().toHEXA().toString();
            nm.extraLines = JSON.parse(JSON.stringify(extraLines));
          } else {
            nm.description = nonItemDescription.value;
            nm.descriptionColor = pickrDescNonItem.getColor().toHEXA().toString();
          }
          addMarker(nm, { onEdit:handleEdit,onCopy:handleCopy,onDragEnd:handleDragEnd,onDelete:handleDelete });
          firebaseAddMarker(db,nm);
          editModal.style.display="none";
          extraLines=[]; editForm.onsubmit=null;
        };
      }
    }]);
  });

  map.on("click", evt => {
    if (copiedMarkerData && pasteMode) {
      const copy = JSON.parse(JSON.stringify(copiedMarkerData));
      delete copy.id;
      copy.coords = [evt.latlng.lat,evt.latlng.lng];
      copy.name += " (copy)";
      addMarker(copy, { onEdit:handleEdit,onCopy:handleCopy,onDragEnd:handleDragEnd,onDelete:handleDelete });
      firebaseAddMarker(db,copy);
    }
  });

  searchBar.addEventListener("input", function() {
    const q = this.value.toLowerCase();
    allMarkers.forEach(item => {
      if (item.data.name.toLowerCase().includes(q)) {
        layers[item.data.type].addLayer(item.markerObj);
      } else {
        layers[item.data.type].removeLayer(item.markerObj);
      }
    });
  });

  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("hidden");
    map.invalidateSize();
    document.getElementById("map").style.marginLeft = sidebar.classList.contains("hidden") ? "0" : "300px";
  });
});

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
import { 
  loadItemDefinitions, 
  addItemDefinition, 
  updateItemDefinition, 
  deleteItemDefinition 
} from "./modules/itemDefinitionsService.js";

// Global storage for predefined item definitions keyed by ID.
let predefinedItemDefs = {};

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Script loaded!");

  // ------------------------------
  // DOM Elements
  // ------------------------------
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
  const predefinedItemContainer = document.getElementById("predefined-item-container");
  const predefinedItemDropdown = document.getElementById("predefined-item-dropdown");

  // Item Definitions Modal Elements
  const manageItemDefinitionsBtn = document.getElementById("manage-item-definitions");
  const itemDefinitionsModal = document.getElementById("item-definitions-modal");
  const closeItemDefinitionsBtn = document.getElementById("close-item-definitions");
  const itemDefinitionsList = document.getElementById("item-definitions-list");
  const itemDefinitionForm = document.getElementById("item-definition-form");
  const defName = document.getElementById("def-name");
  const defType = document.getElementById("def-type");
  const defRarity = document.getElementById("def-rarity");
  const defDescription = document.getElementById("def-description");
  const defImageSmall = document.getElementById("def-image-small");
  const defImageBig = document.getElementById("def-image-big");
  const defExtraLinesContainer = document.getElementById("def-extra-lines");
  const addDefExtraLineBtn = document.getElementById("add-def-extra-line");
  const defSearch = document.getElementById("def-search");
  
  // Filter buttons in Definitions modal
  const filterNameBtn = document.getElementById("filter-name");
  const filterTypeBtn = document.getElementById("filter-type");
  const filterRarityBtn = document.getElementById("filter-rarity");

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
  const { map, bounds } = initializeMap();

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

  // In-memory markers collection
  let allMarkers = [];

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
  // Color Picker Setup for Marker Edit Modal
  // ------------------------------
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
    const selectedId = predefinedItemDropdown.value;
    if (selectedId && predefinedItemDefs[selectedId]) {
      const def = predefinedItemDefs[selectedId];
      editName.value = def.name || "";
      pickrName.setColor(def.nameColor || "#E5E6E8");
      editRarity.value = def.rarity || "";
      pickrRarity.setColor(def.rarityColor || "#E5E6E8");
      editItemType.value = def.itemType || def.type || "";
      pickrItemType.setColor(def.itemTypeColor || "#E5E6E8");
      editDescription.value = def.description || "";
      pickrDescItem.setColor(def.descriptionColor || "#E5E6E8");
      extraLines = def.extraLines ? JSON.parse(JSON.stringify(def.extraLines)) : [];
      renderExtraLines();
      editImageSmall.value = def.imageSmall || "";
      editImageBig.value = def.imageBig || "";
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
    updateItemFieldsVisibility();
    if (m.type === "Item") {
      predefinedItemDropdown.value = m.predefinedItemId ? m.predefinedItemId : "";
      editRarity.value = m.rarity ? m.rarity.toLowerCase() : "";
      pickrRarity.setColor(m.rarityColor || "#E5E6E8");
      editItemType.value = m.itemType || "Crafting Material";
      pickrItemType.setColor(m.itemTypeColor || "#E5E6E8");
      editDescription.value = m.description || "";
      pickrDescItem.setColor(m.descriptionColor || "#E5E6E8");
      extraLines = m.extraLines ? JSON.parse(JSON.stringify(m.extraLines)) : [];
      renderExtraLines();
    } else {
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
    data.predefinedItemId = predefinedItemDropdown.value || null;
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
    firebaseUpdateMarker(db, data);
    editModal.style.display = "none";
    extraLines = [];
    currentEditMarker = null;
  });

  // ------------------------------
  // Predefined Item Dropdown Population
  // ------------------------------
  async function populatePredefinedItemsDropdown() {
    try {
      const definitions = await loadItemDefinitions(db);
      predefinedItemDefs = {};
      predefinedItemDropdown.innerHTML = '<option value="">-- Select an item --</option>';
      definitions.forEach(def => {
        predefinedItemDefs[def.id] = def;
        const option = document.createElement("option");
        option.value = def.id;
        option.textContent = def.name;
        predefinedItemDropdown.appendChild(option);
      });
    } catch (err) {
      console.error("Error loading predefined items:", err);
    }
  }

  // ------------------------------
  // Manage Item Definitions Modal Functionality
  // ------------------------------
  manageItemDefinitionsBtn.addEventListener("click", async () => {
    itemDefinitionsModal.style.display = "block";
    await loadAndRenderItemDefinitions();
    if (!window.pickrDefName) {
      window.pickrDefName = createPicker('#pickr-def-name');
      window.pickrDefType = createPicker('#pickr-def-type');
      window.pickrDefRarity = createPicker('#pickr-def-rarity');
      window.pickrDefDescription = createPicker('#pickr-def-description');
    }
  });
  closeItemDefinitionsBtn.addEventListener("click", () => {
    itemDefinitionsModal.style.display = "none";
  });
  window.addEventListener("click", (event) => {
    if (event.target === itemDefinitionsModal) {
      itemDefinitionsModal.style.display = "none";
    }
  });

  let extraDefLines = [];
  addDefExtraLineBtn.addEventListener("click", () => {
    extraDefLines.push({ text: "", color: "#E5E6E8" });
    renderDefExtraLines();
  });
  function renderDefExtraLines() {
    defExtraLinesContainer.innerHTML = "";
    extraDefLines.forEach((lineObj, idx) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.style.marginBottom = "5px";
      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.value = lineObj.text;
      textInput.style.background = "#E5E6E8";
      textInput.style.color = "#000";
      textInput.addEventListener("input", () => {
        extraDefLines[idx].text = textInput.value;
      });
      const colorDiv = document.createElement("div");
      colorDiv.className = "color-btn";
      colorDiv.style.marginLeft = "5px";
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "x";
      removeBtn.style.marginLeft = "5px";
      removeBtn.addEventListener("click", () => {
        extraDefLines.splice(idx, 1);
        renderDefExtraLines();
      });
      row.appendChild(textInput);
      row.appendChild(colorDiv);
      row.appendChild(removeBtn);
      defExtraLinesContainer.appendChild(row);
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
        extraDefLines[idx].color = color.toHEXA().toString();
      })
      .on('save', (color, pickr) => {
        pickr.hide();
      });
      linePickr.setColor(lineObj.color || "#E5E6E8");
    });
  }

  async function loadAndRenderItemDefinitions() {
    try {
      const definitions = await loadItemDefinitions(db);
      itemDefinitionsList.innerHTML = "";
      definitions.forEach(def => {
        const defDiv = document.createElement("div");
        defDiv.className = "item-def-entry";
        defDiv.style.borderBottom = "1px solid #555";
        defDiv.style.padding = "5px 0";
        defDiv.innerHTML = `
          <span class="def-name"><strong>${def.name}</strong></span> 
          (<span class="def-type">${def.itemType || def.type}</span>) - 
          <span class="def-rarity">${def.rarity || ""}</span>
          <br/><em class="def-description">${def.description || ""}</em>
          <br/>
          <button data-edit="${def.id}">Edit</button>
          <button data-delete="${def.id}">Delete</button>
        `;
        itemDefinitionsList.appendChild(defDiv);

        defDiv.querySelector("[data-edit]").addEventListener("click", () => {
          defName.value = def.name;
          defType.value = def.type;
          defRarity.value = def.rarity || "";
          defDescription.value = def.description || "";
          defImageSmall.value = def.imageSmall || "";
          defImageBig.value = def.imageBig || "";
          extraDefLines = def.extraLines ? JSON.parse(JSON.stringify(def.extraLines)) : [];
          renderDefExtraLines();
          defName.dataset.editId = def.id;
          if (window.pickrDefName) {
            window.pickrDefName.setColor(def.nameColor || "#E5E6E8");
          }
          if (window.pickrDefType) {
            window.pickrDefType.setColor(def.itemTypeColor || "#E5E6E8");
          }
          if (window.pickrDefRarity) {
            window.pickrDefRarity.setColor(def.rarityColor || "#E5E6E8");
          }
          if (window.pickrDefDescription) {
            window.pickrDefDescription.setColor(def.descriptionColor || "#E5E6E8");
          }
        });
        defDiv.querySelector("[data-delete]").addEventListener("click", async () => {
          if (confirm("Are you sure you want to delete this item definition?")) {
            await deleteItemDefinition(db, def.id);
            loadAndRenderItemDefinitions();
            if (editType.value === "Item") {
              populatePredefinedItemsDropdown();
            }
          }
        });
      });
    } catch (err) {
      console.error("Error rendering item definitions:", err);
    }
  }

  // Updated item definition form submission: reset form, extra info, and Pickr controls.
  itemDefinitionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const defData = {
      name: defName.value,
      type: defType.value,
      rarity: defRarity.value,
      description: defDescription.value,
      imageSmall: defImageSmall.value,
      imageBig: defImageBig.value,
      extraLines: JSON.parse(JSON.stringify(extraDefLines)),
      nameColor: window.pickrDefName ? window.pickrDefName.getColor()?.toHEXA()?.toString() : "#E5E6E8",
      itemTypeColor: window.pickrDefType ? window.pickrDefType.getColor()?.toHEXA()?.toString() : "#E5E6E8",
      rarityColor: window.pickrDefRarity ? window.pickrDefRarity.getColor()?.toHEXA()?.toString() : "#E5E6E8",
      descriptionColor: window.pickrDefDescription ? window.pickrDefDescription.getColor()?.toHEXA()?.toString() : "#E5E6E8"
    };
    if (defName.dataset.editId) {
      defData.id = defName.dataset.editId;
      await updateItemDefinition(db, defData);
      delete defName.dataset.editId;
    } else {
      await addItemDefinition(db, defData);
    }
    itemDefinitionForm.reset();
    extraDefLines = [];
    defExtraLinesContainer.innerHTML = "";
    if (window.pickrDefName) { window.pickrDefName.setColor("#E5E6E8"); }
    if (window.pickrDefType) { window.pickrDefType.setColor("#E5E6E8"); }
    if (window.pickrDefRarity) { window.pickrDefRarity.setColor("#E5E6E8"); }
    if (window.pickrDefDescription) { window.pickrDefDescription.setColor("#E5E6E8"); }
    loadAndRenderItemDefinitions();
    if (editType.value === "Item") {
      populatePredefinedItemsDropdown();
    }
  });

  // ------------------------------
  // Marker Creation and Management
  // ------------------------------
  function createMarkerWrapper(m, callbacks) {
    const markerObj = createMarker(m, map, layers, showContextMenu, callbacks);
    allMarkers.push({ markerObj, data: m });
    return markerObj;
  }
  function addMarker(m, callbacks = {}) {
    return createMarkerWrapper(m, callbacks);
  }
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
  async function loadAndDisplayMarkers() {
    try {
      const markers = await loadMarkers(db);
      markers.forEach(m => {
        if (!m.type || !layers[m.type]) {
          console.error(`Invalid marker type: ${m.type}`);
          return;
        }
        if (!m.coords) m.coords = [1500, 1500];
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

  map.on("contextmenu", (evt) => {
    showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [
      {
        text: "Create New Marker",
        action: () => {
          currentEditMarker = null;
          // Set default values for creation form.
          editName.value = "";
          pickrName.setColor("#E5E6E8");
          editType.value = "Item"; // Default to Item; user can change.
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
          updateItemFieldsVisibility();
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
              newMarker.extraLines = JSON.parse(JSON.stringify(extraLines));
            } else {
              newMarker.description = nonItemDescription.value;
              newMarker.descriptionColor = pickrDescNonItem.getColor()?.toHEXA()?.toString() || "#E5E6E8";
            }
            addMarker(newMarker, {
              onEdit: handleEdit,
              onCopy: handleCopy,
              onDragEnd: handleDragEnd,
              onDelete: handleDelete
            });
            firebaseAddMarker(db, newMarker);
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
  map.on("click", (evt) => {
    if (copiedMarkerData && pasteMode) {
      const newMarkerData = JSON.parse(JSON.stringify(copiedMarkerData));
      delete newMarkerData.id;
      newMarkerData.coords = [evt.latlng.lat, evt.latlng.lng];
      newMarkerData.name = newMarkerData.name + " (copy)";
      addMarker(newMarkerData, {
        onEdit: handleEdit,
        onCopy: handleCopy,
        onDragEnd: handleDragEnd,
        onDelete: handleDelete
      });
      firebaseAddMarker(db, newMarkerData);
    }
  });
  searchBar.addEventListener("input", function() {
    const query = this.value.toLowerCase();
    allMarkers.forEach(item => {
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

  // ------------------------------
  // Definitions List Search Functionality & Filter Buttons
  // ------------------------------
  // Default filter settings: all off by default
  const filterSettings = {
    name: false,
    type: false,
    rarity: false
  };
  function updateFilterButtonAppearance(button, active) {
    if (active) {
      button.classList.add("toggled");
    } else {
      button.classList.remove("toggled");
    }
  }
  // Initialize filter buttons appearance
  updateFilterButtonAppearance(filterNameBtn, filterSettings.name);
  updateFilterButtonAppearance(filterTypeBtn, filterSettings.type);
  updateFilterButtonAppearance(filterRarityBtn, filterSettings.rarity);

  filterNameBtn.addEventListener("click", () => {
    filterSettings.name = !filterSettings.name;
    updateFilterButtonAppearance(filterNameBtn, filterSettings.name);
    filterDefinitions();
  });
  filterTypeBtn.addEventListener("click", () => {
    filterSettings.type = !filterSettings.type;
    updateFilterButtonAppearance(filterTypeBtn, filterSettings.type);
    filterDefinitions();
  });
  filterRarityBtn.addEventListener("click", () => {
    filterSettings.rarity = !filterSettings.rarity;
    updateFilterButtonAppearance(filterRarityBtn, filterSettings.rarity);
    filterDefinitions();
  });

  function filterDefinitions() {
    const query = defSearch.value.toLowerCase();
    Array.from(itemDefinitionsList.children).forEach(entry => {
      // Get text from each field by their span classes.
      const nameText = entry.querySelector('.def-name') ? entry.querySelector('.def-name').innerText.toLowerCase() : "";
      const typeText = entry.querySelector('.def-type') ? entry.querySelector('.def-type').innerText.toLowerCase() : "";
      const rarityText = entry.querySelector('.def-rarity') ? entry.querySelector('.def-rarity').innerText.toLowerCase() : "";
      let match = false;
      // If no filter is enabled, show all definitions.
      if (!filterSettings.name && !filterSettings.type && !filterSettings.rarity) {
        match = true;
      } else {
        if (filterSettings.name && nameText.includes(query)) match = true;
        if (filterSettings.type && typeText.includes(query)) match = true;
        if (filterSettings.rarity && rarityText.includes(query)) match = true;
      }
      entry.style.display = match ? "" : "none";
    });
  }
  if (defSearch) {
    defSearch.addEventListener("input", filterDefinitions);
  }
});

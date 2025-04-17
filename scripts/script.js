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
import { setupSidebar } from "./modules/sidebarManager.js";   // ← NEW

// Global store for predefined item definitions (keyed by Firestore ID)
let predefinedItemDefs = {};

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Script loaded!");

  /* ------------------------------------------------------------------
   *  DOM ELEMENTS  (sidebar elements handled by sidebarManager)
   * ------------------------------------------------------------------ */
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

  // Item‑definitions modal
  const manageItemDefinitionsBtn = document.getElementById("manage-item-definitions");
  const itemDefinitionsModal     = document.getElementById("item-definitions-modal");
  const closeItemDefinitionsBtn  = document.getElementById("close-item-definitions");
  const itemDefinitionsList      = document.getElementById("item-definitions-list");
  const itemDefinitionForm       = document.getElementById("item-definition-form");
  const defName                  = document.getElementById("def-name");
  const defType                  = document.getElementById("def-type");
  const defRarity                = document.getElementById("def-rarity");
  const defDescription           = document.getElementById("def-description");
  const defImageSmall            = document.getElementById("def-image-small");
  const defImageBig              = document.getElementById("def-image-big");
  const defExtraLinesContainer   = document.getElementById("def-extra-lines");
  const addDefExtraLineBtn       = document.getElementById("add-def-extra-line");
  const defSearch                = document.getElementById("def-search");

  // Filter buttons inside definitions modal
  const filterNameBtn            = document.getElementById("filter-name");
  const filterTypeBtn            = document.getElementById("filter-type");
  const filterRarityBtn          = document.getElementById("filter-rarity");

  // Headings inside modal
  const defFormHeading           = document.getElementById("def-form-heading");
  const defFormSubheading        = document.getElementById("def-form-subheading");

  // Cancel button in definitions form
  const defCancelBtn             = document.getElementById("def-cancel");

  /* ------------------------------------------------------------------
   *  FIREBASE INIT
   * ------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------
   *  MAP INIT
   * ------------------------------------------------------------------ */
  const { map } = initializeMap();

  /* ------------------------------------------------------------------
   *  LAYERS
   * ------------------------------------------------------------------ */
  const itemLayer = L.markerClusterGroup();
  const layers = {
    "Door":              L.layerGroup(),
    "Extraction Portal": L.layerGroup(),
    "Item":              itemLayer,
    "Teleport":          L.layerGroup()
  };
  Object.values(layers).forEach(l => l.addTo(map));

  /* ------------------------------------------------------------------
   *  IN‑MEMORY MARKER CACHE
   * ------------------------------------------------------------------ */
  const allMarkers = [];

  /* ------------------------------------------------------------------
   *  SIDEBAR (collapse + live search)
   * ------------------------------------------------------------------ */
  setupSidebar(map, layers, allMarkers);

  /* ------------------------------------------------------------------
   *  COPY / PASTE STATE
   * ------------------------------------------------------------------ */
  let copiedMarkerData = null;
  let pasteMode        = false;
  function cancelPasteMode() {
    pasteMode        = false;
    copiedMarkerData = null;
  }
  attachContextMenuHider();
  attachRightClickCancel(cancelPasteMode);

  /* ------------------------------------------------------------------
   *  DRAGGABLE EDIT MODAL
   * ------------------------------------------------------------------ */
  makeDraggable(editModal, editModalHandle);

  /* ------------------------------------------------------------------
   *  VIDEO POP‑UP
   * ------------------------------------------------------------------ */
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
    videoPopup.style.left = `${x}px`;
    videoPopup.style.top  = `${y}px`;
    videoPopup.style.display = "block";
  }
  window.openVideoPopup = openVideoPopup;

  /* ------------------------------------------------------------------
   *  PICKR COLOUR PICKERS (Edit Modal)
   * ------------------------------------------------------------------ */
  function createPicker(selector) {
    return Pickr.create({
      el: selector,
      theme: "nano",
      default: "#E5E6E8",
      components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: { hex: true, rgba: true, input: true, save: true }
      }
    }).on("save", (_, p) => p.hide());
  }
  const pickrName        = createPicker("#pickr-name");
  const pickrRarity      = createPicker("#pickr-rarity");
  const pickrItemType    = createPicker("#pickr-itemtype");
  const pickrDescItem    = createPicker("#pickr-desc-item");
  const pickrDescNonItem = createPicker("#pickr-desc-nonitem");

  /* ------------------------------------------------------------------
   *  HELPER – SHOW / HIDE ITEM‑SPECIFIC FIELDS
   * ------------------------------------------------------------------ */
  function updateItemFieldsVisibility() {
    if (editType.value === "Item") {
      itemExtraFields.style.display        = "block";
      nonItemDescription.style.display     = "none";
      predefinedItemContainer.style.display= "block";
      populatePredefinedItemsDropdown();
    } else {
      itemExtraFields.style.display        = "none";
      nonItemDescription.style.display     = "block";
      predefinedItemContainer.style.display= "none";
    }
  }
  editType.addEventListener("change", updateItemFieldsVisibility);

  /* ------------------------------------------------------------------
   *  PREDEFINED ITEM DROPDOWN CHANGE
   * ------------------------------------------------------------------ */
  predefinedItemDropdown.addEventListener("change", () => {
    const id = predefinedItemDropdown.value;
    if (!id || !predefinedItemDefs[id]) return;

    const def = predefinedItemDefs[id];
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
    editImageBig.value   = def.imageBig   || "";
  });

  /* ------------------------------------------------------------------
   *  EDIT‑FORM HELPERS
   * ------------------------------------------------------------------ */
  let extraLines = [];           //  <<<<<<  declared here so populateEditForm can use it

  function renderExtraLines() {
    extraLinesContainer.innerHTML = "";
    extraLines.forEach((lineObj, idx) => {
      const row       = document.createElement("div");
      row.className   = "field-row";
      row.style.marginBottom = "5px";

      const textInput = document.createElement("input");
      textInput.type  = "text";
      textInput.value = lineObj.text;
      textInput.style.background = "#E5E6E8";
      textInput.style.color      = "#000";
      textInput.addEventListener("input", () => {
        extraLines[idx].text = textInput.value;
      });

      const colorDiv  = document.createElement("div");
      colorDiv.className = "color-btn";
      colorDiv.style.marginLeft = "5px";

      const removeBtn = document.createElement("button");
      removeBtn.type  = "button";
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

      // Individual Pickr for this line
      const linePickr = Pickr.create({
        el: colorDiv,
        theme: "nano",
        default: lineObj.color || "#E5E6E8",
        components: {
          preview: true, opacity: true, hue: true,
          interaction: { hex: true, rgba: true, input: true, save: true }
        }
      })
      .on("change", (c) => { extraLines[idx].color = c.toHEXA().toString(); })
      .on("save",  (_, p) => p.hide());
      linePickr.setColor(lineObj.color || "#E5E6E8");
    });
  }

  // ADD MISSING FUNCTION: populateEditForm  ---------------------------
  function populateEditForm(m) {
    editName.value = m.name || "";
    pickrName.setColor(m.nameColor || "#E5E6E8");
    editType.value = m.type || "Door";
    editImageSmall.value = m.imageSmall || "";
    editImageBig.value   = m.imageBig   || "";
    editVideoURL.value   = m.videoURL  || "";
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
  // -------------------------------------------------------------------

  document.getElementById("add-extra-line")
          .addEventListener("click", () => {
            extraLines.push({ text: "", color: "#E5E6E8" });
            renderExtraLines();
          });
  document.getElementById("edit-cancel")
          .addEventListener("click", () => {
            editModal.style.display = "none";
            currentEditMarker = null;
            extraLines = [];
          });

  /* ------------------------------------------------------------------
   *  SAVE (EDIT FORM SUBMIT)
   * ------------------------------------------------------------------ */
  let currentEditMarker = null;
  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentEditMarker) return;

    const data = currentEditMarker.data;
    data.name        = editName.value;
    data.nameColor   = pickrName.getColor()?.toHEXA()?.toString() || "#E5E6E8";
    data.type        = editType.value;
    data.imageSmall  = editImageSmall.value;
    data.imageBig    = editImageBig.value;
    data.videoURL    = editVideoURL.value || "";
    data.predefinedItemId = predefinedItemDropdown.value || null;

    if (data.type === "Item") {
      data.rarity         = formatRarity(editRarity.value);
      data.rarityColor    = pickrRarity.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      data.itemType       = editItemType.value;
      data.itemTypeColor  = pickrItemType.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      data.description    = editDescription.value;
      data.descriptionColor = pickrDescItem.getColor()?.toHEXA()?.toString() || "#E5E6E8";
      data.extraLines     = JSON.parse(JSON.stringify(extraLines));
    } else {
      data.description     = nonItemDescription.value;
      data.descriptionColor= pickrDescNonItem.getColor()?.toHEXA()?.toString() || "#E5E6E8";
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

  /* ------------------------------------------------------------------
   *  PREDEFINED ITEM DROPDOWN POPULATION
   * ------------------------------------------------------------------ */
  async function populatePredefinedItemsDropdown() {
    try {
      const defs = await loadItemDefinitions(db);
      predefinedItemDefs  = {};
      predefinedItemDropdown.innerHTML = '<option value="">-- Select an item --</option>';
      defs.forEach(d => {
        predefinedItemDefs[d.id] = d;
        const opt       = document.createElement("option");
        opt.value       = d.id;
        opt.textContent = d.name;
        predefinedItemDropdown.appendChild(opt);
      });
    } catch (err) {
      console.error("loadItemDefinitions:", err);
    }
  }

  /* ------------------------------------------------------------------
   *  MARKER FACTORY + CRUD CALLBACKS
   * ------------------------------------------------------------------ */
  function createMarkerWrapper(m, callbacks) {
    const markerObj = createMarker(m, map, layers, showContextMenu, callbacks);
    allMarkers.push({ markerObj, data: m });
    return markerObj;
  }
  function addMarker(m, callbacks={}) {
    return createMarkerWrapper(m, callbacks);
  }

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
    const i = allMarkers.findIndex(o => o.data.id === m.id);
    if (i !== -1) allMarkers.splice(i, 1);
    if (m.id) firebaseDeleteMarker(db, m.id);
  }

  async function loadAndDisplayMarkers() {
    try {
      const markers = await loadMarkers(db);
      markers.forEach(m => {
        if (!m.type || !layers[m.type]) {
          console.error(`Invalid marker type: ${m.type}`); return;
        }
        if (!m.coords) m.coords = [1500,1500];
        addMarker(m, {
          onEdit:    handleEdit,
          onCopy:    handleCopy,
          onDragEnd: handleDragEnd,
          onDelete:  handleDelete
        });
      });
    } catch (err) { console.error("loadMarkers:", err); }
  }
  loadAndDisplayMarkers();

  /* ------------------------------------------------------------------
   *  MAP CONTEXT MENU – CREATE NEW MARKER
   * ------------------------------------------------------------------ */
  map.on("contextmenu", (evt) => {
    showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [{
      text: "Create New Marker",
      action: () => {
        currentEditMarker = null;
        editName.value    = "";
        pickrName.setColor("#E5E6E8");
        editType.value    = "Item";
        editImageSmall.value = "";
        editImageBig.value   = "";
        editVideoURL.value   = "";
        editRarity.value     = "";
        pickrRarity.setColor("#E5E6E8");
        editItemType.value   = "Crafting Material";
        pickrItemType.setColor("#E5E6E8");
        editDescription.value = "";
        pickrDescItem.setColor("#E5E6E8");
        extraLines = [];
        renderExtraLines();
        updateItemFieldsVisibility();
        positionModal(editModal, evt.originalEvent);
        editModal.style.display = "block";

        // Temporarily override submit to create marker
        const originalSubmit = editForm.onsubmit;
        editForm.onsubmit = (e2) => {
          e2.preventDefault();
          const newMarker = {
            type: editType.value,
            name: editName.value || "New Marker",
            nameColor: pickrName.getColor()?.toHEXA()?.toString() || "#E5E6E8",
            coords: [evt.latlng.lat, evt.latlng.lng],
            imageSmall: editImageSmall.value,
            imageBig:   editImageBig.value,
            videoURL:   editVideoURL.value || "",
            predefinedItemId: predefinedItemDropdown.value || null
          };
          if (newMarker.type === "Item") {
            newMarker.rarity         = formatRarity(editRarity.value);
            newMarker.rarityColor    = pickrRarity.getColor()?.toHEXA()?.toString() || "#E5E6E8";
            newMarker.itemType       = editItemType.value;
            newMarker.itemTypeColor  = pickrItemType.getColor()?.toHEXA()?.toString() || "#E5E6E8";
            newMarker.description    = editDescription.value;
            newMarker.descriptionColor = pickrDescItem.getColor()?.toHEXA()?.toString() || "#E5E6E8";
            newMarker.extraLines     = JSON.parse(JSON.stringify(extraLines));
          } else {
            newMarker.description     = nonItemDescription.value;
            newMarker.descriptionColor= pickrDescNonItem.getColor()?.toHEXA()?.toString() || "#E5E6E8";
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
          editForm.onsubmit = originalSubmit;  // restore
        };
      }
    }]);
  });

  /* ------------------------------------------------------------------
   *  MAP CLICK – PASTE COPIED MARKER
   * ------------------------------------------------------------------ */
  map.on("click", (evt) => {
    if (!copiedMarkerData || !pasteMode) return;
    const newMarkerData = JSON.parse(JSON.stringify(copiedMarkerData));
    delete newMarkerData.id;
    newMarkerData.coords = [evt.latlng.lat, evt.latlng.lng];
    newMarkerData.name  += " (copy)";
    addMarker(newMarkerData, {
      onEdit: handleEdit,
      onCopy: handleCopy,
      onDragEnd: handleDragEnd,
      onDelete: handleDelete
    });
    firebaseAddMarker(db, newMarkerData);
  });

  /* ------------------------------------------------------------------
   *  ITEM‑DEFINITIONS MODAL – OPEN / CLOSE
   * ------------------------------------------------------------------ */
  manageItemDefinitionsBtn.addEventListener("click", async () => {
    itemDefinitionsModal.style.display = "block";
    await loadAndRenderItemDefinitions();
    defFormHeading.innerText    = "Add Item";
    defFormSubheading.innerText = "Add Item";
    if (!window.pickrDefName) {
      window.pickrDefName       = createPicker("#pickr-def-name");
      window.pickrDefType       = createPicker("#pickr-def-type");
      window.pickrDefRarity     = createPicker("#pickr-def-rarity");
      window.pickrDefDescription= createPicker("#pickr-def-description");
    }
  });
  closeItemDefinitionsBtn.addEventListener("click", () => {
    itemDefinitionsModal.style.display = "none";
  });
  window.addEventListener("click", (e) => {
    if (e.target === itemDefinitionsModal) itemDefinitionsModal.style.display = "none";
  });

  /* ------------------------------------------------------------------
   *  DEFINITIONS MODAL – EXTRA INFO LINES
   * ------------------------------------------------------------------ */
  let extraDefLines = [];
  function renderDefExtraLines() {
    defExtraLinesContainer.innerHTML = "";
    extraDefLines.forEach((lineObj, idx) => {
      const row       = document.createElement("div");
      row.className   = "field-row";
      row.style.marginBottom = "5px";

      const textInput = document.createElement("input");
      textInput.type  = "text";
      textInput.value = lineObj.text;
      textInput.style.background = "#E5E6E8";
      textInput.style.color      = "#000";
      textInput.addEventListener("input", () => {
        extraDefLines[idx].text = textInput.value;
      });

      const colorDiv  = document.createElement("div");
      colorDiv.className = "color-btn";
      colorDiv.style.marginLeft = "5px";

      const removeBtn = document.createElement("button");
      removeBtn.type  = "button";
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
        theme: "nano",
        default: lineObj.color || "#E5E6E8",
        components: {
          preview: true, opacity: true, hue: true,
          interaction: { hex: true, rgba: true, input: true, save: true }
        }
      })
      .on("change", (c) => { extraDefLines[idx].color = c.toHEXA().toString(); })
      .on("save",  (_, p) => p.hide());
      linePickr.setColor(lineObj.color || "#E5E6E8");
    });
  }
  addDefExtraLineBtn.addEventListener("click", () => {
    extraDefLines.push({ text: "", color: "#E5E6E8" });
    renderDefExtraLines();
  });

  /* ------------------------------------------------------------------
   *  ITEM‑DEFINITIONS CRUD + RENDER
   * ------------------------------------------------------------------ */
  async function loadAndRenderItemDefinitions() {
    try {
      const list = await loadItemDefinitions(db);
      itemDefinitionsList.innerHTML = "";
      list.forEach(def => {
        const div = document.createElement("div");
        div.className = "item-def-entry";
        div.style.borderBottom = "1px solid #555";
        div.style.padding = "5px 0";
        div.innerHTML = `
          <span class="def-name"><strong>${def.name}</strong></span>
          (<span class="def-type">${def.itemType || def.type}</span>) –
          <span class="def-rarity">${def.rarity || ""}</span>
          <br/><em class="def-description">${def.description || ""}</em>
          <br/>
          <button data-edit="${def.id}">Edit</button>
          <button data-delete="${def.id}">Delete</button>
        `;
        itemDefinitionsList.appendChild(div);

        div.querySelector("[data-edit]").addEventListener("click", () => {
          defName.value        = def.name;
          defType.value        = def.type;
          defRarity.value      = def.rarity || "";
          defDescription.value = def.description || "";
          defImageSmall.value  = def.imageSmall || "";
          defImageBig.value    = def.imageBig || "";
          extraDefLines = def.extraLines ? JSON.parse(JSON.stringify(def.extraLines)) : [];
          renderDefExtraLines();
          defName.dataset.editId = def.id;
          if (window.pickrDefName)        window.pickrDefName.setColor(def.nameColor || "#E5E6E8");
          if (window.pickrDefType)        window.pickrDefType.setColor(def.itemTypeColor || "#E5E6E8");
          if (window.pickrDefRarity)      window.pickrDefRarity.setColor(def.rarityColor || "#E5E6E8");
          if (window.pickrDefDescription) window.pickrDefDescription.setColor(def.descriptionColor || "#E5E6E8");
          defFormHeading.innerText    = "Edit Item";
          defFormSubheading.innerText = "Edit Item";
        });

        div.querySelector("[data-delete]").addEventListener("click", async () => {
          if (!confirm("Delete this item definition?")) return;
          await deleteItemDefinition(db, def.id);
          loadAndRenderItemDefinitions();
          if (editType.value === "Item") populatePredefinedItemsDropdown();
        });
      });
    } catch (err) { console.error("renderItemDefinitions:", err); }
  }

  /* ------------------------------------------------------------------
   *  DEFINITIONS FORM SUBMIT
   * ------------------------------------------------------------------ */
  itemDefinitionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: defName.value,
      type: defType.value,
      rarity: defRarity.value,
      description: defDescription.value,
      imageSmall: defImageSmall.value,
      imageBig: defImageBig.value,
      extraLines: JSON.parse(JSON.stringify(extraDefLines)),
      nameColor:        window.pickrDefName       ? window.pickrDefName.getColor()?.toHEXA()?.toString()       : "#E5E6E8",
      itemTypeColor:    window.pickrDefType       ? window.pickrDefType.getColor()?.toHEXA()?.toString()       : "#E5E6E8",
      rarityColor:      window.pickrDefRarity     ? window.pickrDefRarity.getColor()?.toHEXA()?.toString()     : "#E5E6E8",
      descriptionColor: window.pickrDefDescription? window.pickrDefDescription.getColor()?.toHEXA()?.toString(): "#E5E6E8"
    };

    if (defName.dataset.editId) {
      payload.id = defName.dataset.editId;
      await updateItemDefinition(db, payload);
      delete defName.dataset.editId;
    } else {
      await addItemDefinition(db, payload);
    }

    itemDefinitionForm.reset();
    extraDefLines = [];
    defExtraLinesContainer.innerHTML = "";
    if (window.pickrDefName)        window.pickrDefName.setColor("#E5E6E8");
    if (window.pickrDefType)        window.pickrDefType.setColor("#E5E6E8");
    if (window.pickrDefRarity)      window.pickrDefRarity.setColor("#E5E6E8");
    if (window.pickrDefDescription) window.pickrDefDescription.setColor("#E5E6E8");
    loadAndRenderItemDefinitions();
    if (editType.value === "Item") populatePredefinedItemsDropdown();
    defFormHeading.innerText    = "Add Item";
    defFormSubheading.innerText = "Add Item";
  });

  /* ------------------------------------------------------------------
   *  DEFINITIONS FORM CANCEL
   * ------------------------------------------------------------------ */
  if (defCancelBtn) {
    defCancelBtn.addEventListener("click", () => {
      itemDefinitionForm.reset();
      extraDefLines = [];
      defExtraLinesContainer.innerHTML = "";
      if (window.pickrDefName)        window.pickrDefName.setColor("#E5E6E8");
      if (window.pickrDefType)        window.pickrDefType.setColor("#E5E6E8");
      if (window.pickrDefRarity)      window.pickrDefRarity.setColor("#E5E6E8");
      if (window.pickrDefDescription) window.pickrDefDescription.setColor("#E5E6E8");
      defFormHeading.innerText    = "Add Item";
      defFormSubheading.innerText = "Add Item";
    });
  }

  /* ------------------------------------------------------------------
   *  DEFINITIONS LIST – SEARCH + FILTER BUTTONS
   * ------------------------------------------------------------------ */
  const filterSettings = { name: false, type: false, rarity: false };
  function updateFilterBtn(btn, active) {
    if (active) btn.classList.add("toggled"); else btn.classList.remove("toggled");
  }
  updateFilterBtn(filterNameBtn,   filterSettings.name);
  updateFilterBtn(filterTypeBtn,   filterSettings.type);
  updateFilterBtn(filterRarityBtn, filterSettings.rarity);

  function filterDefinitions() {
    const q = defSearch.value.toLowerCase();
    Array.from(itemDefinitionsList.children).forEach(entry => {
      const name  = entry.querySelector(".def-name")?.innerText.toLowerCase()  || "";
      const type  = entry.querySelector(".def-type")?.innerText.toLowerCase()  || "";
      const rar   = entry.querySelector(".def-rarity")?.innerText.toLowerCase()|| "";
      let match = !filterSettings.name && !filterSettings.type && !filterSettings.rarity;
      if (filterSettings.name   && name.includes(q))  match = true;
      if (filterSettings.type   && type.includes(q))  match = true;
      if (filterSettings.rarity && rar.includes(q))   match = true;
      entry.style.display = match ? "" : "none";
    });
  }

  filterNameBtn.addEventListener("click", () => {
    filterSettings.name = !filterSettings.name;
    updateFilterBtn(filterNameBtn, filterSettings.name);
    filterDefinitions();
  });
  filterTypeBtn.addEventListener("click", () => {
    filterSettings.type = !filterSettings.type;
    updateFilterBtn(filterTypeBtn, filterSettings.type);
    filterDefinitions();
  });
  filterRarityBtn.addEventListener("click", () => {
    filterSettings.rarity = !filterSettings.rarity;
    updateFilterBtn(filterRarityBtn, filterSettings.rarity);
    filterDefinitions();
  });
  defSearch.addEventListener("input", filterDefinitions);

});

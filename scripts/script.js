// scripts/script.js
//
// Orchestrates map, Firebase, layers, marker‑form manager, item‑definition
// modal, copy/paste, sidebar search & layer toggles.
//
import { initializeMap }               from "./modules/map.js";
import {
  showContextMenu,
  attachContextMenuHider,
  attachRightClickCancel
}                                      from "./modules/uiManager.js";
import {
  initializeFirebase,
  loadMarkers,
  addMarker    as firebaseAdd,
  updateMarker as firebaseUpdate,
  deleteMarker as firebaseDelete
}                                      from "./modules/firebaseService.js";
import {
  createMarker,
  createPopupContent
}                                      from "./modules/markerManager.js";

import {
  initMarkerFormManager,
  showEditForm,
  showCreateForm,
  refreshPredefinedItems
}                                      from "./modules/markerFormManager.js";

import {
  loadItemDefinitions,
  addItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
}                                      from "./modules/itemDefinitionsService.js";

document.addEventListener("DOMContentLoaded", async () => {
  // ─────────────────────────── Firebase
  const db = initializeFirebase({
    apiKey:            "AIzaSyDwEdPN5MB8YAuM_jb0K1iXfQ-tGQ",
    authDomain:        "vbmap-cc834.firebaseapp.com",
    projectId:         "vbmap-cc834",
    storageBucket:     "vbmap-cc834.firebasestorage.app",
    messagingSenderId: "244112699360",
    appId:             "1:244112699360:web:95f50adb6e10b438238585",
    measurementId:     "G-7FDNWLRM95"
  });

  // ─────────────────────────── Map & layers
  const { map } = initializeMap();
  const itemCluster = L.markerClusterGroup();
  const layers = {
    "Door":              L.layerGroup().addTo(map),
    "Extraction Portal": L.layerGroup().addTo(map),
    "Item":              itemCluster.addTo(map),
    "Teleport":          L.layerGroup().addTo(map)
  };

  // ─────────────────────────── Marker‑form manager
  await initMarkerFormManager(db);

  // ─────────────────────────── State
  let allMarkers = [];
  let copiedData = null;
  let pasteMode  = false;
  const cancelPasteMode = () => { copiedData = null; pasteMode = false; };
  attachContextMenuHider();
  attachRightClickCancel(cancelPasteMode);

  // ───────────── helper to add/create a marker on the map + wire callbacks
  function addMarkerToMap(m) {
    const markerObj = createMarker(m, map, layers, showContextMenu, {
      onEdit: (mo, data, ev) =>
        showEditForm(
          data,
          updated => {
            mo.setPopupContent(createPopupContent(updated));
            firebaseUpdate(db, updated);
          },
          ev
        ),
      onCopy: (_mo, data) => {
        copiedData = JSON.parse(JSON.stringify(data));
        delete copiedData.id;
        pasteMode = true;
      },
      onDragEnd: (mo, data) => {
        data.coords = [mo.getLatLng().lat, mo.getLatLng().lng];
        firebaseUpdate(db, data);
      },
      onDelete: (mo, data) => {
        layers[data.type].removeLayer(mo);
        allMarkers = allMarkers.filter(x => x.data.id !== data.id);
        firebaseDelete(db, data.id);
      }
    });
    allMarkers.push({ markerObj, data: m });
  }

  // ─────────────────────────── Load existing markers
  (await loadMarkers(db)).forEach(addMarkerToMap);

  // ─────────────────────────── Map right‑click → “Create marker”
  map.on("contextmenu", (evt) => {
    showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [
      {
        text: "Create New Marker",
        action: () => {
          const defaults = { type: "Item", name: "", imageSmall: "", imageBig: "", videoURL: "" };
          showCreateForm(
            evt.latlng,
            defaults,
            (newMarker) => {
              addMarkerToMap(newMarker);
              firebaseAdd(db, newMarker);
            },
            evt.originalEvent
          );
        }
      }
    ]);
  });

  // ─────────────────────────── Paste‑mode click
  map.on("click", (evt) => {
    if (pasteMode && copiedData) {
      const dup = { ...JSON.parse(JSON.stringify(copiedData)) };
      dup.coords = [evt.latlng.lat, evt.latlng.lng];
      dup.name  = `${dup.name} (copy)`;
      addMarkerToMap(dup);
      firebaseAdd(db, dup);
    }
  });

  // ─────────────────────────── Sidebar search + toggle
  const searchBar     = document.getElementById("search-bar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar       = document.getElementById("sidebar");

  searchBar.addEventListener("input", function () {
    const q = this.value.toLowerCase();
    allMarkers.forEach(({ markerObj, data }) => {
      const match = data.name.toLowerCase().includes(q);
      if (match) layers[data.type].addLayer(markerObj);
      else       layers[data.type].removeLayer(markerObj);
    });
  });

  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("hidden");
    document.getElementById("map").style.marginLeft =
      sidebar.classList.contains("hidden") ? "0" : "300px";
    map.invalidateSize();
  });

  // ════════════════════════════════════════════════════════════════════════
  //  Manage Item‑Definitions modal (unchanged from your original script,
  //  except calls now use refreshPredefinedItems()).
  // ════════════════════════════════════════════════════════════════════════

  // ---------- DOM refs ----------
  const manageItemDefinitionsBtn = document.getElementById("manage-item-definitions");
  const itemDefinitionsModal     = document.getElementById("item-definitions-modal");
  const closeItemDefinitionsBtn  = document.getElementById("close-item-definitions");
  const itemDefinitionsList      = document.getElementById("item-definitions-list");
  const itemDefinitionForm       = document.getElementById("item-definition-form");
  const defName        = document.getElementById("def-name");
  const defType        = document.getElementById("def-type");
  const defRarity      = document.getElementById("def-rarity");
  const defDescription = document.getElementById("def-description");
  const defImageSmall  = document.getElementById("def-image-small");
  const defImageBig    = document.getElementById("def-image-big");
  const defExtraLinesContainer = document.getElementById("def-extra-lines");
  const addDefExtraLineBtn     = document.getElementById("add-def-extra-line");
  const defSearch      = document.getElementById("def-search");
  const filterNameBtn  = document.getElementById("filter-name");
  const filterTypeBtn  = document.getElementById("filter-type");
  const filterRarityBtn= document.getElementById("filter-rarity");
  const defFormHeading = document.getElementById("def-form-heading");
  const defFormSubheading = document.getElementById("def-form-subheading");
  const defCancelBtn   = document.getElementById("def-cancel");

  // ---------- Pickr helper for the modal ----------
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

  // ---------- Extra‑info lines in the modal ----------
  let extraDefLines = [];
  addDefExtraLineBtn.addEventListener("click", () => {
    extraDefLines.push({ text: "", color: "#E5E6E8" });
    renderDefExtraLines();
  });

  function renderDefExtraLines() {
    defExtraLinesContainer.innerHTML = "";
    extraDefLines.forEach((line, idx) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.style.marginBottom = "5px";

      const text = document.createElement("input");
      text.type = "text";
      text.value = line.text;
      text.style.background = "#E5E6E8";
      text.style.color = "#000";
      text.addEventListener("input", () => { extraDefLines[idx].text = text.value; });

      const colourDiv = document.createElement("div");
      colourDiv.className = "color-btn";
      colourDiv.style.marginLeft = "5px";

      const rm = document.createElement("button");
      rm.type = "button";
      rm.textContent = "x";
      rm.style.marginLeft = "5px";
      rm.addEventListener("click", () => { extraDefLines.splice(idx,1); renderDefExtraLines(); });

      row.appendChild(text);
      row.appendChild(colourDiv);
      row.appendChild(rm);
      defExtraLinesContainer.appendChild(row);

      const p = Pickr.create({
        el: colourDiv,
        theme: 'nano',
        default: line.color || "#E5E6E8",
        components: {
          preview: true, opacity: true, hue: true,
          interaction: { hex: true, rgba: true, input: true, save: true }
        }
      })
        .on('change', (c)=> extraDefLines[idx].color = c.toHEXA().toString())
        .on('save',  (_,p)=> p.hide());
    });
  }

  // ---------- Load & render definitions ----------
  async function loadAndRenderItemDefinitions() {
    try {
      const defs = await loadItemDefinitions(db);
      itemDefinitionsList.innerHTML = "";
      defs.forEach(def => {
        const entry = document.createElement("div");
        entry.className = "item-def-entry";
        entry.style.borderBottom = "1px solid #555";
        entry.style.padding = "5px 0";
        entry.innerHTML = `
          <span class="def-name"><strong>${def.name}</strong></span> 
          (<span class="def-type">${def.itemType || def.type}</span>) - 
          <span class="def-rarity">${def.rarity || ""}</span>
          <br/><em class="def-description">${def.description || ""}</em>
          <br/>
          <button data-edit="${def.id}">Edit</button>
          <button data-delete="${def.id}">Delete</button>
        `;
        itemDefinitionsList.appendChild(entry);

        // Edit
        entry.querySelector("[data-edit]").addEventListener("click", () => {
          defName.value        = def.name;
          defType.value        = def.type;
          defRarity.value      = def.rarity || "";
          defDescription.value = def.description || "";
          defImageSmall.value  = def.imageSmall || "";
          defImageBig.value    = def.imageBig   || "";
          extraDefLines        = def.extraLines ? JSON.parse(JSON.stringify(def.extraLines)) : [];
          renderDefExtraLines();
          defName.dataset.editId = def.id;
          if (window.pickrDefName)     window.pickrDefName.setColor(def.nameColor || "#E5E6E8");
          if (window.pickrDefType)     window.pickrDefType.setColor(def.itemTypeColor || "#E5E6E8");
          if (window.pickrDefRarity)   window.pickrDefRarity.setColor(def.rarityColor || "#E5E6E8");
          if (window.pickrDefDescription) window.pickrDefDescription.setColor(def.descriptionColor || "#E5E6E8");
          defFormHeading.innerText   = "Edit Item";
          defFormSubheading.innerText= "Edit Item";
        });

        // Delete
        entry.querySelector("[data-delete]").addEventListener("click", async () => {
          if (confirm("Delete this item definition?")) {
            await deleteItemDefinition(db, def.id);
            loadAndRenderItemDefinitions();
            await refreshPredefinedItems();
          }
        });
      });
    } catch (err) {
      console.error("Error rendering item definitions:", err);
    }
  }

  // ---------- Open / close modal ----------
  manageItemDefinitionsBtn.addEventListener("click", async () => {
    itemDefinitionsModal.style.display = "block";
    await loadAndRenderItemDefinitions();
    defFormHeading.innerText = defFormSubheading.innerText = "Add Item";

    if (!window.pickrDefName) {
      window.pickrDefName       = createPicker("#pickr-def-name");
      window.pickrDefType       = createPicker("#pickr-def-type");
      window.pickrDefRarity     = createPicker("#pickr-def-rarity");
      window.pickrDefDescription= createPicker("#pickr-def-description");
    }
  });
  closeItemDefinitionsBtn.addEventListener("click", ()=> itemDefinitionsModal.style.display = "none");
  window.addEventListener("click", (e)=> {
    if (e.target === itemDefinitionsModal) itemDefinitionsModal.style.display = "none";
  });

  // ---------- Submit definition form ----------
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
      nameColor: window.pickrDefName?.getColor()?.toHEXA()?.toString()     || "#E5E6E8",
      itemTypeColor: window.pickrDefType?.getColor()?.toHEXA()?.toString() || "#E5E6E8",
      rarityColor: window.pickrDefRarity?.getColor()?.toHEXA()?.toString() || "#E5E6E8",
      descriptionColor: window.pickrDefDescription?.getColor()?.toHEXA()?.toString() || "#E5E6E8"
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
    ["pickrDefName","pickrDefType","pickrDefRarity","pickrDefDescription"].forEach(k=>{
      if (window[k]) window[k].setColor("#E5E6E8");
    });
    await loadAndRenderItemDefinitions();
    await refreshPredefinedItems();
    defFormHeading.innerText = defFormSubheading.innerText = "Add Item";
  });

  // ---------- Cancel definition form ----------
  if (defCancelBtn) {
    defCancelBtn.addEventListener("click", () => {
      itemDefinitionForm.reset();
      extraDefLines = [];
      defExtraLinesContainer.innerHTML = "";
      ["pickrDefName","pickrDefType","pickrDefRarity","pickrDefDescription"].forEach(k=>{
        if (window[k]) window[k].setColor("#E5E6E8");
      });
      defFormHeading.innerText = defFormSubheading.innerText = "Add Item";
    });
  }

  // ---------- List filter / search ----------
  const filterSettings = { name:false, type:false, rarity:false };
  function updateFilterBtn(btn, active) {
    btn.classList.toggle("toggled", active);
  }
  updateFilterBtn(filterNameBtn,false);
  updateFilterBtn(filterTypeBtn,false);
  updateFilterBtn(filterRarityBtn,false);

  filterNameBtn.addEventListener("click", ()=> { filterSettings.name = !filterSettings.name; updateFilterBtn(filterNameBtn,filterSettings.name);  filterDefinitions(); });
  filterTypeBtn.addEventListener("click", ()=> { filterSettings.type = !filterSettings.type; updateFilterBtn(filterTypeBtn,filterSettings.type);    filterDefinitions(); });
  filterRarityBtn.addEventListener("click", ()=>{ filterSettings.rarity=!filterSettings.rarity;updateFilterBtn(filterRarityBtn,filterSettings.rarity);filterDefinitions(); });

  function filterDefinitions() {
    const q = defSearch.value.toLowerCase();
    [...itemDefinitionsList.children].forEach(entry=>{
      const n = entry.querySelector('.def-name') ?.innerText.toLowerCase()  || "";
      const t = entry.querySelector('.def-type')?.innerText.toLowerCase()  || "";
      const r = entry.querySelector('.def-rarity')?.innerText.toLowerCase()|| "";
      let match = (!filterSettings.name && !filterSettings.type && !filterSettings.rarity);
      if (filterSettings.name   && n.includes(q)) match = true;
      if (filterSettings.type   && t.includes(q)) match = true;
      if (filterSettings.rarity && r.includes(q)) match = true;
      entry.style.display = match ? "" : "none";
    });
  }
  defSearch?.addEventListener("input", filterDefinitions);
});

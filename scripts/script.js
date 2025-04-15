document.addEventListener("DOMContentLoaded", () => {
  console.log("Script loaded!");

  // ===========================
  // Firebase Setup (Replace placeholders with your config)
  // ===========================
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "yourproject.firebaseapp.com",
    projectId: "yourproject",
    storageBucket: "yourproject.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // ===========================
  // Leaflet Map Initialization
  // ===========================
  const map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 4,
    zoomControl: false
  });
  L.control.zoom({ position: "topright" }).addTo(map);
  const bounds = [[0, 0], [3000, 3000]];
  L.imageOverlay("./media/images/tempmap.png", bounds).addTo(map);
  map.fitBounds(bounds);

  let itemLayer = L.markerClusterGroup();
  const layers = {
    "Door": L.layerGroup(),
    "Extraction Portal": L.layerGroup(),
    "Item": itemLayer,
    "Teleport": L.layerGroup()
  };
  Object.values(layers).forEach(layer => layer.addTo(map));

  let allMarkers = [];

  // ===========================
  // Context Menu (Right-click)
  // ===========================
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
  document.addEventListener("click", () => {
    contextMenu.style.display = "none";
  });
  function showContextMenu(x, y, options) {
    contextMenu.innerHTML = "";
    options.forEach(opt => {
      const div = document.createElement("div");
      div.innerText = opt.text;
      div.style.padding = "5px 10px";
      div.style.cursor = "pointer";
      div.addEventListener("click", () => {
        opt.action();
        contextMenu.style.display = "none";
      });
      contextMenu.appendChild(div);
    });
    contextMenu.style.left = x + "px";
    contextMenu.style.top = y + "px";
    contextMenu.style.display = "block";
  }

  // ===========================
  // Draggable Edit Modal (Defensive check)
  // ===========================
  const editModal = document.getElementById("edit-modal");
  if (!editModal) {
    console.error("Edit modal element not found!");
  } else {
    const editModalHandle = document.getElementById("edit-modal-handle");
    if (!editModalHandle) {
      console.error("Edit modal handle element not found!");
    } else {
      let isDragging = false, offsetX = 0, offsetY = 0;
      editModalHandle.addEventListener("mousedown", e => {
        isDragging = true;
        const style = window.getComputedStyle(editModal);
        offsetX = e.clientX - parseInt(style.left, 10);
        offsetY = e.clientY - parseInt(style.top, 10);
        e.preventDefault();
      });
      document.addEventListener("mousemove", e => {
        if (isDragging) {
          editModal.style.left = (e.clientX - offsetX) + "px";
          editModal.style.top = (e.clientY - offsetY) + "px";
        }
      });
      document.addEventListener("mouseup", () => {
        isDragging = false;
      });
    }
  }

  // ===========================
  // Video Popup
  // ===========================
  const videoPopup = document.getElementById("video-popup");
  const videoPlayer = document.getElementById("video-player");
  const videoSource = document.getElementById("video-source");
  document.getElementById("video-close").addEventListener("click", () => {
    videoPopup.style.display = "none";
    videoPlayer.pause();
  });
  window.openVideoPopup = (x, y, url) => {
    videoSource.src = url;
    videoPlayer.load();
    videoPopup.style.left = x + "px";
    videoPopup.style.top = y + "px";
    videoPopup.style.display = "block";
  };

  // ===========================
  // Edit Form & Fields
  // ===========================
  const editForm = document.getElementById("edit-form");
  const editName = document.getElementById("edit-name");
  const pickrName = createPickr("#pickr-name");

  // Type / Rarity / Item Type logic
  const editType = document.getElementById("edit-type");
  const editRarity = document.getElementById("edit-rarity");
  const pickrRarity = createPickr("#pickr-rarity");
  // Hide rarity elements by default
  if (editRarity) { editRarity.style.display = "none"; }
  const itemtypeRow = document.getElementById("itemtype-row");
  const editItemSubtype = document.getElementById("edit-item-type");
  const pickrItemType = createPickr("#pickr-itemtype");
  if (itemtypeRow) { itemtypeRow.style.display = "none"; }

  // Description
  const editDescription = document.getElementById("edit-description");
  const pickrDesc = createPickr("#pickr-desc");

  // Extra Info Dynamic Fields
  let extraLines = [];
  const extraLinesContainer = document.getElementById("extra-lines");
  const addExtraLineBtn = document.getElementById("add-extra-line");
  addExtraLineBtn.addEventListener("click", () => {
    extraLines.push({ text: "", color: "#ffffff" });
    renderExtraLines();
  });
  function renderExtraLines() {
    extraLinesContainer.innerHTML = "";
    extraLines.forEach((line, idx) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.style.marginLeft = "120px";
      row.style.marginBottom = "5px";
      
      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.value = line.text;
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
      
      const linePickr = createPickr(colorDiv);
      linePickr.on("change", color => {
        extraLines[idx].color = color.toHEXA().toString();
      });
      linePickr.setColor(line.color);
    });
  }

  // Image and Video Fields
  const editImageS = document.getElementById("edit-image-s");
  const editImageL = document.getElementById("edit-image-l");
  const editVideo = document.getElementById("edit-video");

  let currentEditMarker = null;

  // Cancel Button
  document.getElementById("edit-cancel").addEventListener("click", () => {
    editModal.style.display = "none";
    currentEditMarker = null;
    extraLines = [];
  });

  // Form Submit Handler
  editForm.addEventListener("submit", e => {
    e.preventDefault();
    if (!currentEditMarker) return;
    const data = currentEditMarker.data;
    data.name = editName.value;
    data.nameColor = pickrName.getColor().toHEXA().toString();
    data.type = editType.value;
    if (data.type === "Item") {
      data.rarity = editRarity.value;
      data.rarityColor = pickrRarity.getColor().toHEXA().toString();
      data.itemType = editItemSubtype.value;
      data.itemTypeColor = pickrItemType.getColor().toHEXA().toString();
      data.description = editDescription.value;
      data.descriptionColor = pickrDesc.getColor().toHEXA().toString();
      data.extraLines = JSON.parse(JSON.stringify(extraLines));
    } else {
      data.description = editDescription.value;
      data.descriptionColor = pickrDesc.getColor().toHEXA().toString();
      delete data.rarity;
      delete data.rarityColor;
      delete data.itemType;
      delete data.itemTypeColor;
      delete data.extraLines;
    }
    data.imageSmall = editImageS.value;
    data.imageBig = editImageL.value;
    data.videoURL = editVideo.value;
    currentEditMarker.markerObj.setPopupContent(createPopupContent(data));
    updateMarkerInFirestore(data);
    editModal.style.display = "none";
    extraLines = [];
    currentEditMarker = null;
  });

  // Helper: Create a Pickr instance
  function createPickr(el) {
    return Pickr.create({
      el: el,
      theme: 'nano',
      default: '#ffffff',
      components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: { hex: true, rgba: true, input: true, save: true }
      }
    });
  }

  // ===========================
  // Marker Icon & Popup Creation
  // ===========================
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
    let typeLine = "";
    let rarityLine = "";
    let itemTypeLine = "";
    let descLine = "";
    let extraInfo = "";
    if (m.type === "Item") {
      if (m.rarity) {
        rarityLine = `<span style="color:${m.rarityColor||"#fff"};">${m.rarity}</span>`;
      }
      if (m.itemType) {
        itemTypeLine = `<div style="color:${m.itemTypeColor||"#fff"};">${m.itemType}</div>`;
      }
      descLine = m.description
        ? `<p style="color:${m.descriptionColor||"#fff"}; margin:5px 0;">${m.description}</p>`
        : "";
      if (m.extraLines && m.extraLines.length) {
        m.extraLines.forEach(line => {
          extraInfo += `<p style="margin:0; color:${line.color||"#fff"};">${line.text}</p>`;
        });
      }
      typeLine = `<span>${m.type}</span>${rarityLine ? " | " + rarityLine : ""}`;
    } else {
      descLine = m.description
        ? `<p style="color:${m.descriptionColor||"#fff"}; margin:5px 0;">${m.description}</p>`
        : "";
      typeLine = `<span>${m.type}</span>`;
    }
    const nameHTML = `<h3 style="margin:0; font-size:20px; color:${m.nameColor||"#fff"};">${m.name}</h3>`;
    let scaledImg = "";
    if (m.imageBig) {
      scaledImg = `<img src="${m.imageBig}" style="width:64px;height:64px;object-fit:contain;border:2px solid #777;border-radius:4px;" />`;
    }
    let videoBtn = "";
    if (m.videoURL) {
      videoBtn = `<button class="more-info-btn" onclick="openVideoPopup(event.clientX, event.clientY, '${m.videoURL}')">Play Video</button>`;
    }
    return `
      <div class="custom-popup">
        <div class="popup-header" style="display:flex; gap:15px;">
          ${scaledImg}
          <div>
            ${nameHTML}
            <div style="font-size:14px; color:#fff; margin-top:2px;">${typeLine}</div>
            ${itemTypeLine}
          </div>
        </div>
        <div class="popup-body">
          ${descLine}
          ${extraInfo}
          ${videoBtn}
        </div>
      </div>
    `;
  }

  // ===========================
  // Firestore Persistence
  // ===========================
  function updateMarkerInFirestore(m) {
    if (m.id) {
      db.collection("markers").doc(m.id).set(m).then(() => {
        console.log("Updated marker:", m.id);
      }).catch(console.error);
    } else {
      db.collection("markers").add(m).then(ref => {
        m.id = ref.id;
        console.log("Added marker with ID:", ref.id);
      }).catch(console.error);
    }
  }
  function deleteMarkerInFirestore(id) {
    db.collection("markers").doc(id).delete().then(() => {
      console.log("Deleted marker:", id);
    }).catch(console.error);
  }

  // ===========================
  // Add Marker Function
  // ===========================
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

    markerObj.on("contextmenu", evt => {
      evt.originalEvent.preventDefault();
      const opts = [
        {
          text: "Edit Marker",
          action: () => {
            currentEditMarker = { markerObj, data: m };
            editName.value = m.name || "";
            pickrName.setColor(m.nameColor || "#ffffff");
            editType.value = m.type || "Door";
            editImageS.value = m.imageSmall || "";
            editImageL.value = m.imageBig || "";
            editVideo.value = m.videoURL || "";
            if (m.type === "Item") {
              editRarity.value = m.rarity || "";
              pickrRarity.setColor(m.rarityColor || "#ffffff");
              document.getElementById("edit-rarity").style.display = "";
              document.getElementById("pickr-rarity").style.display = "";
              itemtypeRow.style.display = "";
              editItemSubtype.value = m.itemType || "Crafting Material";
              pickrItemType.setColor(m.itemTypeColor || "#ffffff");
              editDescription.value = m.description || "";
              pickrDesc.setColor(m.descriptionColor || "#ffffff");
              extraLines = m.extraLines ? JSON.parse(JSON.stringify(m.extraLines)) : [];
              renderExtraLines();
            } else {
              editRarity.value = "";
              document.getElementById("edit-rarity").style.display = "none";
              document.getElementById("pickr-rarity").style.display = "none";
              itemtypeRow.style.display = "none";
              editDescription.value = m.description || "";
              pickrDesc.setColor(m.descriptionColor || "#ffffff");
            }
            editModal.style.left = (evt.originalEvent.pageX + 10) + "px";
            editModal.style.top = (evt.originalEvent.pageY + 10) + "px";
            editModal.style.display = "block";
          }
        },
        {
          text: "Duplicate Marker",
          action: () => {
            const dup = JSON.parse(JSON.stringify(m));
            dup.name += " (copy)";
            const newMarkerObj = addMarker(dup);
            newMarkerObj.dragging.enable();
            const moveHandler = ev2 => {
              const latlng = map.layerPointToLatLng(L.point(ev2.clientX, ev2.clientY));
              newMarkerObj.setLatLng(latlng);
            };
            const dropHandler = () => {
              const latlng = newMarkerObj.getLatLng();
              dup.coords = [latlng.lat, latlng.lng];
              updateMarkerInFirestore(dup);
              newMarkerObj.dragging.disable();
              document.removeEventListener("mousemove", moveHandler);
              document.removeEventListener("click", dropHandler);
            };
            document.addEventListener("mousemove", moveHandler);
            document.addEventListener("click", dropHandler);
            updateMarkerInFirestore(dup);
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
      if (m.id) {
        opts.push({
          text: "Delete Marker",
          action: () => {
            layers[m.type].removeLayer(markerObj);
            const idx = allMarkers.findIndex(o => o.data.id === m.id);
            if (idx !== -1) allMarkers.splice(idx, 1);
            deleteMarkerInFirestore(m.id);
          }
        });
      }
      showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, opts);
    });
    return markerObj;
  }

  // ===========================
  // Load Markers (Firestore then fallback)
  // ===========================
  function loadMarkers() {
    db.collection("markers").get()
      .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          let mData = doc.data();
          mData.id = doc.id;
          if (!mData.type || !layers[mData.type]) {
            console.error(`Invalid marker type: ${mData.type}`);
            return;
          }
          if (!mData.coords) mData.coords = [1500, 1500];
          addMarker(mData);
        });
      })
      .catch(err => {
        console.error("Error loading markers from Firestore:", err);
        fetch("./data/markerData.json")
          .then(resp => {
            if (!resp.ok) throw new Error("Network response was not ok");
            return resp.json();
          })
          .then(data => {
            data.forEach(m => {
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

  // ===========================
  // Right-click on Map -> Create New Marker
  // ===========================
  map.on("contextmenu", evt => {
    showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [
      {
        text: "Create New Marker",
        action: () => {
          currentEditMarker = null;
          editName.value = "";
          pickrName.setColor("#ffffff");
          editType.value = "Door";
          editImageS.value = "";
          editImageL.value = "";
          editVideo.value = "";
          editRarity.value = "";
          pickrRarity.setColor("#ffffff");
          editItemSubtype.value = "Crafting Material";
          pickrItemType.setColor("#ffffff");
          editDescription.value = "";
          pickrDesc.setColor("#ffffff");
          extraLines = [];
          renderExtraLines();
          // Hide item-specific sections since default Type is "Door"
          document.getElementById("edit-rarity").style.display = "none";
          document.getElementById("pickr-rarity").style.display = "none";
          itemtypeRow.style.display = "none";
          editModal.style.left = (evt.originalEvent.pageX + 10) + "px";
          editModal.style.top = (evt.originalEvent.pageY + 10) + "px";
          editModal.style.display = "block";
          editForm.onsubmit = e2 => {
            e2.preventDefault();
            const newMarker = {
              type: editType.value,
              name: editName.value || "New Marker",
              nameColor: pickrName.getColor().toHEXA().toString(),
              coords: [evt.latlng.lat, evt.latlng.lng],
              imageSmall: editImageS.value,
              imageBig: editImageL.value,
              videoURL: editVideo.value || ""
            };
            if (newMarker.type === "Item") {
              newMarker.rarity = editRarity.value;
              newMarker.rarityColor = pickrRarity.getColor().toHEXA().toString();
              newMarker.itemType = editItemSubtype.value;
              newMarker.itemTypeColor = pickrItemType.getColor().toHEXA().toString();
              newMarker.description = editDescription.value;
              newMarker.descriptionColor = pickrDesc.getColor().toHEXA().toString();
              newMarker.extraLines = JSON.parse(JSON.stringify(extraLines));
            } else {
              newMarker.description = editDescription.value;
              newMarker.descriptionColor = pickrDesc.getColor().toHEXA().toString();
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

  // ===========================
  // Sidebar Toggle
  // ===========================
  document.getElementById("sidebar-toggle").addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar");
    const mapDiv = document.getElementById("map");
    sidebar.classList.toggle("hidden");
    mapDiv.style.marginLeft = sidebar.classList.contains("hidden") ? "0" : "300px";
    map.invalidateSize();
  });

  // ===========================
  // Basic Search
  // ===========================
  document.getElementById("search-bar").addEventListener("input", function() {
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

  // ===========================
  // Toggle Marker Grouping for Item markers
  // ===========================
  document.getElementById("disable-grouping").addEventListener("change", function() {
    map.removeLayer(layers["Item"]);
    if (this.checked) {
      layers["Item"] = L.layerGroup();
    } else {
      layers["Item"] = L.markerClusterGroup();
    }
    allMarkers.forEach(item => {
      if (item.data.type === "Item") {
        layers["Item"].addLayer(item.markerObj);
      }
    });
    layers["Item"].addTo(map);
  });
});

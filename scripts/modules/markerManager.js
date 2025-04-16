// scripts/modules/markerManager.js

/**
 * Creates a custom Leaflet divIcon for a marker.
 * @param {Object} m Marker data object.
 * @returns {L.DivIcon} A Leaflet divIcon instance.
 */
export function createCustomIcon(m) {
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
  
  /**
   * Generates HTML content for a marker popup.
   * @param {Object} m Marker data object.
   * @returns {string} HTML string for the popup.
   */
  export function createPopupContent(m) {
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
  
  /**
   * Formats the rarity string.
   * @param {string} val The rarity text.
   * @returns {string} Formatted rarity.
   */
  export function formatRarity(val) {
    if (!val) return "";
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
  }
  
  /**
   * Creates a new marker on the map with bound UI events.
   * @param {Object} m Marker data.
   * @param {L.Map} map Leaflet map instance.
   * @param {Object} layers Object mapping marker types to their corresponding layer.
   * @param {Function} contextMenuCallback Function to display a context menu (should accept x, y, and options).
   * @param {Object} callbacks Callback functions: { onEdit, onCopy, onDragEnd, onDelete }
   * @returns {L.Marker} The created marker.
   */
  export function createMarker(m, map, layers, contextMenuCallback, callbacks = {}) {
    const markerObj = L.marker([m.coords[0], m.coords[1]], {
      icon: createCustomIcon(m),
      draggable: false
    });
  
    markerObj.bindPopup(createPopupContent(m), {
      className: "custom-popup-wrapper",
      maxWidth: 350
    });
  
    // Add the marker to its appropriate layer.
    layers[m.type].addLayer(markerObj);
  
    // Bind a contextmenu event to display UI options.
    markerObj.on("contextmenu", (evt) => {
      evt.originalEvent.preventDefault();
      const options = [
        {
          text: "Edit Marker",
          action: () => {
            if (typeof callbacks.onEdit === "function") {
              callbacks.onEdit(markerObj, m, evt.originalEvent);
            }
          }
        },
        {
          text: "Copy Marker",
          action: () => {
            if (typeof callbacks.onCopy === "function") {
              callbacks.onCopy(markerObj, m, evt.originalEvent);
            }
          }
        },
        {
          text: markerObj.dragging && markerObj.dragging.enabled() ? "Disable Drag" : "Enable Drag",
          action: () => {
            if (markerObj.dragging && markerObj.dragging.enabled()) {
              markerObj.dragging.disable();
            } else {
              markerObj.dragging.enable();
              markerObj.on("dragend", () => {
                m.coords = [markerObj.getLatLng().lat, markerObj.getLatLng().lng];
                if (typeof callbacks.onDragEnd === "function") {
                  callbacks.onDragEnd(markerObj, m);
                }
              });
            }
          }
        },
        {
          text: "Delete Marker",
          action: () => {
            if (typeof callbacks.onDelete === "function") {
              callbacks.onDelete(markerObj, m);
            }
          }
        }
      ];
      contextMenuCallback(evt.originalEvent.pageX, evt.originalEvent.pageY, options);
    });
  
    return markerObj;
  }
  
// @file: src/modules/map/marker/icons/createMarker.js
// @version: 1.3 — use global L and fix module imports

// Assumes Leaflet is loaded via a <script> tag and exposes window.L
const L = window.L;

import { renderItemPopup }  from "../popups/itemPopup.js";
import { renderChestPopup } from "../popups/chestPopup.js";
import { createCustomIcon } from "./createCustomIcon.js";
import { CHEST_RARITY }     from "../utils.js";
// climb up three levels to reach src/modules/utils/colorPresets.js
import { rarityColors, defaultNameColor } from "../../../../shared/utils/color/colorPresets.js";

/**
 * Create a Leaflet marker with custom icon, popup, drag, and context menu.
 *
 * @param {object} m           – marker data object
 * @param {L.Map} map
 * @param {object<string,L.LayerGroup>} layers
 * @param {function(number,number,Array<object>)} ctxMenu – showContextMenu(x,y,items)
 * @param {object} callbacks   – { onEdit, onCopy, onDelete, onDragEnd }
 * @param {boolean} isAdmin
 * @returns {L.Marker}
 */
export function createMarker(m, map, layers, ctxMenu, callbacks = {}, isAdmin = false) {
  // 1) If this is a chest, compute and inject its rarityColor
  if (m.chestDefFull) {
    const cat  = m.chestDefFull.category || "Normal";
    const size = m.chestDefFull.size     || "Small";
    const key  = CHEST_RARITY[cat]?.[size] || "common";
    m.rarity      = key;
    m.rarityColor = rarityColors[key] || defaultNameColor;
  }

  // 2) Instantiate the Leaflet marker
  const markerObj = L.marker(m.coords, {
    icon:      createCustomIcon(m),
    draggable: false
  });

  // 3) Wire up dragend if admin toggles dragging on
  markerObj.on("dragend", ev => {
    const { lat, lng } = ev.target.getLatLng();
    m.coords = [lat, lng];
    callbacks.onDragEnd?.(markerObj, m);
  });

  // 4) Bind popup using the appropriate renderer
  const html = (m.type === "Chest" && m.chestDefFull)
    ? renderChestPopup(m.chestDefFull)
    : renderItemPopup(m);

  markerObj.bindPopup(html, {
    className:   "custom-popup-wrapper",
    maxWidth:    350,
    closeButton: false,
    offset:      [0, -35]
  });

  // 5) When popup opens, wire close button and chest‐slot previews
  markerObj.on("popupopen", () => {
    document.querySelector(".custom-popup .popup-close-btn")
      ?.addEventListener("click", () => markerObj.closePopup());

    document.querySelectorAll(".custom-popup .chest-slot[data-index]")
      .forEach(el => {
        el.removeAttribute("title");
        const idx = el.getAttribute("data-index");
        el.addEventListener("mouseenter", e => {
          if (!idx || !m.chestDefFull) return;
          const item = m.chestDefFull.lootPool[idx];
          if (!item) return;
          const preview = document.createElement("div");
          preview.className = "chest-item-preview";
          preview.innerHTML = renderItemPopup(item);
          Object.assign(preview.style, {
            position: "absolute",
            zIndex:   "1102",
            left:     `${e.clientX + 8}px`,
            top:      `${e.clientY + 8}px`
          });
          document.body.append(preview);
          el._previewEl = preview;
        });
        el.addEventListener("mouseleave", () => {
          el._previewEl?.remove();
        });
      });
  });

  // 6) Clean up any floating previews on close
  markerObj.on("popupclose", () => {
    document.querySelectorAll(".chest-item-preview").forEach(el => el.remove());
  });

  // 7) Add to its layer
  layers[m.type]?.addLayer(markerObj);

  // 8) Context menu for admin actions
  markerObj.on("contextmenu", ev => {
    ev.originalEvent.preventDefault();
    const opts = [];
    if (isAdmin) {
      opts.push(
        { text: "Edit Marker",   action: () => callbacks.onEdit?.(markerObj, m, ev.originalEvent) },
        { text: "Copy Marker",   action: () => callbacks.onCopy?.(markerObj, m, ev.originalEvent) },
        {
          text: markerObj.dragging.enabled() ? "Disable Drag" : "Enable Drag",
          action: () => markerObj.dragging.enabled()
            ? markerObj.dragging.disable()
            : markerObj.dragging.enable()
        },
        { text: "Delete Marker", action: () => callbacks.onDelete?.(markerObj, m) }
      );
    }
    ctxMenu(ev.originalEvent.pageX, ev.originalEvent.pageY, opts);
  });

  return markerObj;
}

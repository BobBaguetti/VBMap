// @file: src/modules/map/marker/icons/createMarker.js
// @version: 1.6 — copy definition ID for NPCs so filters can match

// Assumes Leaflet is loaded via a <script> tag and exposes window.L
const L = window.L;

import { renderItemPopup }  from "../popups/itemPopup.js";
import { renderChestPopup } from "../popups/chestPopup.js";
import { createCustomIcon } from "./createCustomIcon.js";
import { CHEST_RARITY }     from "../utils.js";
import {
  rarityColors,
  defaultNameColor,
  dispositionColors,
  tierColors
} from "../../../../shared/utils/color/colorPresets.js";

/**
 * Create a Leaflet marker with custom icon, popup, drag, and context menu.
 *
 * @param {object} m           – marker data object
 * @param {L.Map} map
 * @param {object<string,L.LayerGroup>} layers
 * @param {function} ctxMenu   – showContextMenu(x,y,items)
 * @param {object} callbacks   – { onEdit, onCopy, onDelete, onDragEnd }
 * @param {boolean} isAdmin
 * @returns {L.Marker}
 */
export function createMarker(m, map, layers, ctxMenu, callbacks = {}, isAdmin = false) {
  // 1) Chest logic: compute and inject rarityColor
  if (m.chestDefFull) {
    const cat  = m.chestDefFull.category || "Normal";
    const size = m.chestDefFull.size     || "Small";
    const key  = CHEST_RARITY[cat]?.[size] || "common";
    m.rarity      = key;
    m.rarityColor = rarityColors[key] || defaultNameColor;
  }

  // 2) NPC logic: copy ID for filtering, then Friendly → dispositionColor; else → tierColor
  if (m.type === "NPC") {
    // ensure filterMarkers can match this marker to its checkbox
    m.npcDefinitionId = m.id;

    if (m.disposition === "Friendly") {
      m.rarityColor = dispositionColors.Friendly;
    } else {
      m.rarityColor = m.tierColor
        || tierColors[m.tier]
        || defaultNameColor;
    }
  }

  // 3) Instantiate the Leaflet marker with our custom icon
  const markerObj = L.marker(m.coords, {
    icon:      createCustomIcon(m),
    draggable: false
  });

  // 4) Wire up dragend if admin toggles dragging on
  markerObj.on("dragend", ev => {
    const { lat, lng } = ev.target.getLatLng();
    m.coords = [lat, lng];
    callbacks.onDragEnd?.(markerObj, m);
  });

  // 5) Bind popup using the appropriate renderer
  const html = (m.type === "Chest" && m.chestDefFull)
    ? renderChestPopup(m.chestDefFull)
    : renderItemPopup(m);
  markerObj.bindPopup(html, {
    className:   "custom-popup-wrapper",
    maxWidth:    350,
    closeButton: false,
    offset:      [0, -35]
  });

  // 6) When popup opens, wire close button and chest‐slot previews
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

  // 7) Clean up any floating previews on close
  markerObj.on("popupclose", () => {
    document.querySelectorAll(".chest-item-preview").forEach(el => el.remove());
  });

  // 8) Add the marker to its layer
  layers[m.type]?.addLayer(markerObj);

  // 9) Context menu for admin actions
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

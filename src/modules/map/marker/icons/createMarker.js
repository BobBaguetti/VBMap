// @file: src/modules/map/marker/icons/createMarker.js
// @version: 1.9 — ensure hover listeners attach to the newly opened popup element

// Assumes Leaflet is loaded via a <script> tag and exposes window.L
const L = window.L;

import { renderItemPopup }   from "../popups/itemPopup.js";
import { renderChestPopup }  from "../popups/chestPopup.js";
import { renderNpcPopup }    from "../popups/npcPopup.js";
import { createCustomIcon }  from "./createCustomIcon.js";
import { CHEST_RARITY }      from "../utils.js";
import {
  rarityColors,
  defaultNameColor,
  dispositionColors,
  tierColors
} from "../../../../shared/utils/color/colorPresets.js";

import definitionsManager    from "../../../../bootstrap/definitionsManager.js";
import { enrichLootPool }    from "../../../../bootstrap/lootUtils.js";
import { attachLootHoverListeners } from "../popups/lootHoverBinder.js";

// New imports for filter actions
import {
  toggleFilter,
  showOnlyFilter
} from "../../../sidebar/filterActions.js";

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
    // Hydrate the chest's lootPool (IDs → full objects)
    enrichLootPool(m.chestDefFull, "Item");
  }

  // 2) NPC logic: Friendly → dispositionColor; Hostile/Neutral → tierColor
  if (m.type === "NPC" && m.npcDefFull) {
    if (m.disposition === "Friendly") {
      m.rarityColor = dispositionColors.Friendly;
    } else {
      m.rarityColor = m.tierColor
        || tierColors[m.tier] 
        || defaultNameColor;
    }
    // Hydrate the NPC's lootPool (IDs → full objects)
    enrichLootPool(m.npcDefFull, "Item");
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
  let html;
  if (m.type === "Chest" && m.chestDefFull) {
    html = renderChestPopup(m.chestDefFull);
  } else if (m.type === "NPC" && m.npcDefFull) {
    html = renderNpcPopup(m.npcDefFull);
  } else {
    html = renderItemPopup(m);
  }

  markerObj.bindPopup(html, {
    className:   "custom-popup-wrapper",
    maxWidth:    350,
    closeButton: false,
    offset:      [0, -35]
  });

  // 6) When popup opens, wire close button and loot-slot previews
  markerObj.on("popupopen", e => {
    // Close button
    // We know the new popup’s root is e.popup.getElement()
    const popupRoot = e.popup.getElement();
    popupRoot
      .querySelector(".custom-popup .popup-close-btn")
      ?.addEventListener("click", () => markerObj.closePopup());

    // Attach hover listeners to any [data-item-id] slot inside this popup
    const popupEl = popupRoot.querySelector(".custom-popup");
    attachLootHoverListeners(popupEl);
  });

  // 7) Clean up any floating previews on close
  markerObj.on("popupclose", () => {
    document.querySelectorAll(".chest-item-preview").forEach(el => el.remove());
  });

  // 8) Add the marker to its layer
  layers[m.type]?.addLayer(markerObj);

  // 9) Context menu for marker actions
  markerObj.on("contextmenu", ev => {
    ev.originalEvent.preventDefault();

    // Determine filter type/key for this marker
    let filterType, filterKey;
    if (m.type === "Item") {
      filterType = "Item";
      filterKey  = m.predefinedItemId;
    } else if (m.type === "Chest") {
      filterType = "Chest";
      filterKey  = m.chestDefFull?.size || "Small";
    } else if (m.type === "NPC") {
      filterType = "NPC";
      filterKey  = m.npcDefFull?.npcDefinitionId || "";
    }

    const opts = [
      // Always-available actions
      {
        text: `Show Only “${m.name}”`,
        action: () => showOnlyFilter(
          filterType,
          filterKey,
          {
            itemFilterListSelector:  "#item-filter-list",
            chestFilterListSelector: "#chest-filter-list",
            npcHostileListSelector:  "#npc-hostile-list",
            npcFriendlyListSelector: "#npc-friendly-list"
          },
          "#main-filters .toggle-group"
        )
      },
      {
        text: `Hide All “${m.name}”`,
        action: () => toggleFilter(
          filterType,
          filterKey,
          {
            itemFilterListSelector:  "#item-filter-list",
            chestFilterListSelector: "#chest-filter-list",
            npcHostileListSelector:  "#npc-hostile-list",
            npcFriendlyListSelector: "#npc-friendly-list"
          }
        )
      }
    ];

    // Admin-only actions
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

    // Show the context menu
    ctxMenu(ev.originalEvent.pageX, ev.originalEvent.pageY, opts);
  });

  return markerObj;
}

// @fullfile: Send the entire file, no omissions or abridgment — version is 2. Increase by 1 every time you update anything.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 2
// @file:    /scripts/modules/map/markerManager.js

import * from 'leaflet';
import { openEmptyMarkerForm, openMarkerFormWithData } from '../ui/markerForm.js';
import { formatRarity } from '../utils/utils.js';

let markersLayerGroup;

/**
 * Initializes marker management on the map.
 * @param {L.Map} map
 * @param {Array<Object>} markersData
 */
export function initializeMarkerManager(map, markersData) {
  markersLayerGroup = L.layerGroup().addTo(map);
  markersData.forEach(data => {
    const marker = createMarker(data);
    markersLayerGroup.addLayer(marker);
  });
}

/**
 * Creates a Leaflet marker with custom icon and context menu.
 * @param {Object} data  Marker data payload
 * @returns {L.Marker}
 */
function createMarker(data) {
  const icon = L.divIcon({
    html: `<div class="marker-icon" style="background-color:${data.color};border:2px solid ${data.borderColor}"></div>`,
    className: 'custom-marker-icon',
    iconSize: [20, 20]
  });

  const marker = L.marker([data.lat, data.lng], { icon, draggable: false });
  marker.options.data = data;
  marker.on('contextmenu', event => showContextMenu(event, data, marker));
  return marker;
}

/**
 * Renders and displays the context menu for a marker.
 */
function showContextMenu(event, data, marker) {
  removeExistingMenu();
  const menu = buildMenu(event);
  const items = [
    { label: 'Edit',        action: () => openMarkerFormWithData(data) },
    { label: 'Toggle Drag', action: () => toggleDrag(marker) },
    { label: 'Copy',        action: () => triggerCopy(data) },
    { label: 'Delete',      action: () => confirmAndDelete(marker, data.id) }
  ];

  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'context-menu__item';
    el.textContent = item.label;
    el.addEventListener('click', () => {
      item.action();
      menu.remove();
    });
    menu.appendChild(el);
  });

  document.body.appendChild(menu);
  document.addEventListener('click', () => menu.remove(), { once: true });
}

function removeExistingMenu() {
  const existing = document.querySelector('.context-menu');
  if (existing) existing.remove();
}

function buildMenu(event) {
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.top = `${event.originalEvent.clientY}px`;
  menu.style.left = `${event.originalEvent.clientX}px`;
  return menu;
}

function toggleDrag(marker) {
  const isDraggable = marker.options.draggable;
  marker.options.draggable = !isDraggable;
  marker.dragging[isDraggable ? 'disable' : 'enable']();
}

function triggerCopy(data) {
  const copyEvent = new CustomEvent('copy-marker', { detail: data });
  document.dispatchEvent(copyEvent);
}

function confirmAndDelete(marker, id) {
  if (confirm('Delete this marker?')) {
    marker.remove();
    // TODO: call deleteMarker(id) from firebaseService
  }
}

// @version: 2

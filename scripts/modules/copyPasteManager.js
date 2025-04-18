// @fullfile: Send the entire file, no omissions or abridgments — version is 2. Increase by 1 every time you update anything.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 2
// @file:    /scripts/modules/copyPasteManager.js

import { ContextMenu } from './ui/uiKit.js';
import * as L from 'leaflet';
import { createCustomIcon } from './map/markerManager.js';

/**
 * Initialise copy‑paste behaviour.
 * @param {L.Map} map                               Leaflet map instance.
 * @param {(data:Object)=>void} addMarkerCallback   Function that adds *and* persists the new marker.
 * @returns {{ startCopy:Function, cancelCopy:Function }}
 */
export function initCopyPasteManager(map, addMarkerCallback) {
  let pasteMode   = false;
  let copiedData  = null;
  let ghostMarker = null;

  /**
   * Cancel paste mode and clean up ghost marker
   */
  function cancelCopy() {
    if (ghostMarker) {
      map.removeLayer(ghostMarker);
      ghostMarker = null;
    }
    pasteMode  = false;
    copiedData = null;
    map.getContainer().style.cursor = '';
  }

  /**
   * Begin paste mode for the supplied marker data
   */
  function startCopy(markerData) {
    copiedData = JSON.parse(JSON.stringify(markerData));
    delete copiedData.id;  // new marker will get its own id
    pasteMode = true;
    map.getContainer().style.cursor = 'copy';

    if (ghostMarker) map.removeLayer(ghostMarker);
    ghostMarker = L.marker(map.getCenter(), {
      icon: createCustomIcon(copiedData),
      interactive: false,
      opacity: 0.5
    }).addTo(map);
  }

  // Listen for global copy events dispatched by context menus
  document.addEventListener('copy-marker', e => {
    startCopy(e.detail);
  });

  // Update ghost marker position on mouse move
  map.on('mousemove', e => {
    if (pasteMode && ghostMarker) ghostMarker.setLatLng(e.latlng);
  });

  // Place a new marker on click when in paste mode
  map.on('click', e => {
    if (!pasteMode || !copiedData) return;

    const newData = JSON.parse(JSON.stringify(copiedData));
    delete newData.id;
    newData.lat = e.latlng.lat;
    newData.lng = e.latlng.lng;

    if (!newData.predefinedItemId) {
      newData.name = `${newData.name} (copy)`;
    }

    addMarkerCallback(newData);
    // remain in paste mode until user cancels
  });

  // Show a ContextMenu to cancel copy on right-click
  map.on('contextmenu', e => {
    if (pasteMode) {
      e.originalEvent.preventDefault();
      const { clientX: x, clientY: y } = e.originalEvent;
      new ContextMenu([
        { label: 'Cancel Copy', action: cancelCopy }
      ]).showAt({ x, y });
    }
  });

  return { startCopy, cancelCopy };
}

// @version: 2

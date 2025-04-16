// ui.js
// Handles UI interactions: context menu, edit modal positioning, and copy/paste mode.

import { getMap } from "./mapSetup.js";
import { logError } from "./errorLogger.js";

// Retrieve key DOM elements with checks.
const editModal = document.getElementById("edit-modal");
if (!editModal) {
  logError("Missing DOM element: edit-modal", new Error("Element with id 'edit-modal' not found."));
}
const editModalHandle = document.getElementById("edit-modal-handle");
if (!editModalHandle) {
  logError("Missing DOM element: edit-modal-handle", new Error("Element with id 'edit-modal-handle' not found."));
}
const pasteTooltip = document.getElementById("paste-tooltip");
if (!pasteTooltip) {
  logError("Missing DOM element: paste-tooltip", new Error("Element with id 'paste-tooltip' not found."));
}

// Create the context menu element.
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

/**
 * Shows the context menu at (x, y) with the provided options.
 * Each option must have a text property and an action function.
 */
export function showContextMenu(x, y, options) {
  try {
    contextMenu.innerHTML = "";
    options.forEach(opt => {
      const menuItem = document.createElement("div");
      menuItem.innerText = opt.text;
      menuItem.style.padding = "5px 10px";
      menuItem.style.cursor = "pointer";
      menuItem.style.whiteSpace = "nowrap";
      menuItem.addEventListener("click", () => {
        try {
          opt.action();
        } catch (err) {
          logError("Error executing context menu action:", err);
        }
        contextMenu.style.display = "none";
      });
      contextMenu.appendChild(menuItem);
    });
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.display = "block";
  } catch (err) {
    logError("Error showing context menu:", err);
  }
}
document.addEventListener("click", () => {
  contextMenu.style.display = "none";
  cancelCopyMode();
});

// Edit Modal Positioning and Draggable Logic
let isDragging = false, modalOffsetX = 0, modalOffsetY = 0;
if (editModalHandle) {
  editModalHandle.addEventListener("mousedown", e => {
    try {
      isDragging = true;
      const style = window.getComputedStyle(editModal);
      modalOffsetX = e.clientX - parseInt(style.left, 10);
      modalOffsetY = e.clientY - parseInt(style.top, 10);
      e.preventDefault();
    } catch (err) {
      logError("Error in edit modal mousedown:", err);
    }
  });
}
document.addEventListener("mousemove", e => {
  if (isDragging) {
    try {
      editModal.style.left = `${e.clientX - modalOffsetX}px`;
      editModal.style.top = `${e.clientY - modalOffsetY}px`;
    } catch (err) {
      logError("Error moving edit modal:", err);
    }
  }
});
document.addEventListener("mouseup", () => {
  isDragging = false;
});

/**
 * Positions the edit modal so its right edge is 10px to the right of the cursor,
 * and vertically centers it around the cursor.
 * @param {MouseEvent} ev - The triggering event.
 */
export function setEditModalPosition(ev) {
  try {
    if (!editModal) return;
    editModal.style.display = "block";
    const modalWidth = editModal.offsetWidth;
    const modalHeight = editModal.offsetHeight;
    editModal.style.left = `${ev.pageX - modalWidth + 10}px`;
    editModal.style.top = `${ev.pageY - (modalHeight / 2)}px`;
  } catch (err) {
    logError("Error positioning edit modal:", err);
  }
}

// Copy Marker (Paste Mode) Logic
let copiedMarkerData = null;

/**
 * Enters copy (paste) mode by deep copying marker data.
 * @param {Object} markerData - Marker data to copy.
 */
export function enterCopyMode(markerData) {
  try {
    copiedMarkerData = JSON.parse(JSON.stringify(markerData));
    if (pasteTooltip) {
      pasteTooltip.style.display = "block";
    }
  } catch (err) {
    logError("Error entering copy mode:", err);
  }
}

/**
 * Cancels copy mode.
 */
export function cancelCopyMode() {
  copiedMarkerData = null;
  if (pasteTooltip) {
    pasteTooltip.style.display = "none";
  }
}

// UI Initialization
export function initUI() {
  try {
    const map = getMap();
    if (!map) {
      throw new Error("Map is not initialized.");
    }
    // Attach event listener for paste mode on the map.
    map.on("click", ev => {
      try {
        if (copiedMarkerData) {
          const newMarkerData = JSON.parse(JSON.stringify(copiedMarkerData));
          newMarkerData.coords = [ev.latlng.lat, ev.latlng.lng];
          newMarkerData.name = newMarkerData.name + " (copy)";
          const event = new CustomEvent("pasteMarker", { detail: newMarkerData });
          document.dispatchEvent(event);
          if (pasteTooltip) {
            pasteTooltip.style.left = `${ev.containerPoint.x + 15}px`;
            pasteTooltip.style.top = `${ev.containerPoint.y + 15}px`;
          }
        }
      } catch (err) {
        logError("Error pasting marker:", err);
      }
    });
    return true;
  } catch (err) {
    logError("Error initializing UI:", err);
    return false;
  }
}

/**
 * Returns the current copied marker data.
 * @returns {Object|null}
 */
export function getCopiedMarkerData() {
  return copiedMarkerData;
}

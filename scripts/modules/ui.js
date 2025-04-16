// ui.js
// This module handles UI interactions such as context menu display, edit modal positioning, and copy/paste mode.

import { getMap } from "./mapSetup.js";
import { logError } from "./errorLogger.js";

// ---------------------------
// Context Menu Setup
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
 * Each option should have a text property and an action function.
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
  // Cancel copy mode if active.
  cancelCopyMode();
});

// ---------------------------
// Edit Modal Positioning and Behavior
const editModal = document.getElementById("edit-modal");
const editModalHandle = document.getElementById("edit-modal-handle");

/**
 * Positions the edit modal so that its right edge is 10px to the right of the cursor,
 * and the modal is vertically centered on the cursor.
 * @param {MouseEvent} ev - The triggering event.
 */
export function setEditModalPosition(ev) {
  try {
    // Temporarily display the modal to measure its dimensions.
    editModal.style.display = "block";
    const modalWidth = editModal.offsetWidth;
    const modalHeight = editModal.offsetHeight;
    // Set left such that modal's right edge is at ev.pageX + 10.
    editModal.style.left = `${ev.pageX - modalWidth + 10}px`;
    // Vertical center: modal's top = ev.pageY - (modalHeight / 2).
    editModal.style.top = `${ev.pageY - (modalHeight / 2)}px`;
  } catch (err) {
    logError("Error positioning edit modal:", err);
  }
}

// Draggable Edit Modal Logic
let isDragging = false, modalOffsetX = 0, modalOffsetY = 0;
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

// ---------------------------
// Copy Marker (Paste Mode) Logic
let copiedMarkerData = null;
const pasteTooltip = document.getElementById("paste-tooltip");

/**
 * Enters copy (paste) mode by storing a deep copy of the marker data.
 * @param {Object} markerData - The data of the marker to copy.
 */
export function enterCopyMode(markerData) {
  try {
    copiedMarkerData = JSON.parse(JSON.stringify(markerData));
    pasteTooltip.style.display = "block";
  } catch (err) {
    logError("Error entering copy mode:", err);
  }
}

/**
 * Cancels copy mode.
 */
export function cancelCopyMode() {
  copiedMarkerData = null;
  pasteTooltip.style.display = "none";
}

// ---------------------------
// UI Initialization
export function initUI() {
  try {
    // Now safely retrieve the map instance (after it has been initialized).
    const map = getMap();
    if (!map) {
      throw new Error("Map is not initialized.");
    }

    // Attach event listener for copy/paste mode.
    map.on("click", ev => {
      try {
        if (copiedMarkerData) {
          const newMarkerData = JSON.parse(JSON.stringify(copiedMarkerData));
          newMarkerData.coords = [ev.latlng.lat, ev.latlng.lng];
          newMarkerData.name = newMarkerData.name + " (copy)";
          // Dispatch a custom event so the main module can handle marker creation.
          const event = new CustomEvent("pasteMarker", { detail: newMarkerData });
          document.dispatchEvent(event);
          pasteTooltip.style.left = `${ev.containerPoint.x + 15}px`;
          pasteTooltip.style.top = `${ev.containerPoint.y + 15}px`;
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

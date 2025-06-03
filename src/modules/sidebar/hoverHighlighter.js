// File: src/modules/sidebar/hoverHighlighter.js

import { allMarkers } from "../../bootstrap/markerLoader.js";
import { markerTypes } from "../marker/types.js";

/**
 * We want:
 *  - highlight immediately on hover
 *  - on leave: wait 500ms before removing styling (to avoid “jitter” when sliding between items)
 *  - if a new highlight comes in before the 500ms is up, cancel the pending reset and highlight the new selection.
 */

/** 
 * Tracks which <img> elements have the "highlighted" class applied 
 */
let highlightedEls = [];

/** 
 * Tracks which <img> elements have the "dimmed" class applied 
 */
let dimmedEls = [];

/** 
 * Timer ID for a pending “reset” (when mouse leaves). 
 * If non-null, indicates we should clear it if a new hover occurs. 
 */
let resetTimerId = null;

// These are the “size” and “category” keys for chest filters.
// When id matches one of these, treat it as size/category instead of def‐ID.
const sizeKeys = ["Small", "Medium", "Large"];
const categoryKeys = ["Normal", "Dragonvault"];

/**
 * Immediately applies highlight & dim classes for a given (type, id).
 * This is called as soon as you hover a new item.
 *
 * @param {string} type  – “Item” / “Chest” / “NPC”
 * @param {string} id    – the defIdKey value to match against marker data,
 *                         or, if type === "Chest", one of sizeKeys/categoryKeys
 */
function doHighlight(type, id) {
  // If there’s a pending reset, cancel it so we don’t wipe out this new highlight.
  if (resetTimerId) {
    clearTimeout(resetTimerId);
    resetTimerId = null;
  }

  // Remove any existing classes from previous highlight
  highlightedEls.forEach(el => el.classList.remove("marker-highlighted"));
  dimmedEls.forEach(el      => el.classList.remove("marker-dimmed"));
  highlightedEls = [];
  dimmedEls      = [];

  // If this is a chest‐size/category filter (e.g. "Small", "Normal", ...),
  // highlight based on data.size or data.category. Otherwise, use defKey logic.
  if (type === "Chest" && (sizeKeys.includes(id) || categoryKeys.includes(id))) {
    allMarkers.forEach(({ markerObj, data }) => {
      const el = markerObj.getElement();
      if (!el) return;

      // If id is in sizeKeys, match data.size; if in categoryKeys, match data.category
      let shouldHighlight = false;
      if (sizeKeys.includes(id)) {
        // e.g. id === "Small"
        shouldHighlight = data.size === id;
      } else {
        // id must be one of categoryKeys, e.g. "Normal" or "Dragonvault"
        shouldHighlight = data.category === id;
      }

      if (data.type === "Chest" && shouldHighlight) {
        el.classList.add("marker-highlighted");
        highlightedEls.push(el);
      } else {
        // All non‐matching markers get dimmed
        el.classList.add("marker-dimmed");
        dimmedEls.push(el);
      }
    });
    return;
  }

  // For Item/NPC or a Chest “defId” (if you ever hover over individual chest definitions),
  // use the standard defKey‐based matching.
  const defKey = markerTypes[type]?.defIdKey;
  allMarkers.forEach(({ markerObj, data }) => {
    const el = markerObj.getElement();
    if (!el) return;

    if (data.type === type && defKey && data[defKey] === id) {
      el.classList.add("marker-highlighted");
      highlightedEls.push(el);
    } else {
      el.classList.add("marker-dimmed");
      dimmedEls.push(el);
    }
  });
}

/**
 * Schedules a “reset” (remove all highlight/dim classes) after 500 ms.
 * If a new highlight comes in during that time, we’ll clear this timer instead.
 */
function scheduleReset() {
  // If a reset is already pending, leave it in place
  if (resetTimerId) return;

  resetTimerId = setTimeout(() => {
    highlightedEls.forEach(el => el.classList.remove("marker-highlighted"));
    dimmedEls.forEach(el      => el.classList.remove("marker-dimmed"));
    highlightedEls = [];
    dimmedEls      = [];
    resetTimerId   = null;
  }, 500);
}

/**
 * Public API: call this on mouseenter of a search result.
 * Immediately calls doHighlight(type, id), canceling any pending reset.
 */
export function highlightMarkers(type, id) {
  doHighlight(type, id);
}

/**
 * Public API: call this on mouseleave of a search result.
 * Doesn’t remove classes immediately—schedules a reset in 500 ms.
 * If another highlight arrives before then, that pending reset is canceled.
 */
export function resetMarkerHighlight() {
  scheduleReset();
}

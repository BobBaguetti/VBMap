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

/**
 * Immediately applies highlight & dim classes for a given (type, id).
 * This is called as soon as you hover a new item.
 *
 * @param {string} type  – “Item” / “Chest” / “NPC”
 * @param {string} id    – the defIdKey value to match against marker data
 */
function doHighlight(type, id) {
  // If there’s a pending reset, cancel it so we don’t wipe out this new highlight.
  if (resetTimerId) {
    clearTimeout(resetTimerId);
    resetTimerId = null;
  }

  // First, remove any existing classes from previous highlight
  highlightedEls.forEach(el => el.classList.remove("marker-highlighted"));
  dimmedEls.forEach(el      => el.classList.remove("marker-dimmed"));
  highlightedEls = [];
  dimmedEls      = [];

  // Determine which data property holds the relevant definition ID (e.g. "predefinedItemId" or "chestTypeId")
  const defKey = markerTypes[type]?.defIdKey;

  // Loop through allMarkers once
  allMarkers.forEach(({ markerObj, data }) => {
    const el = markerObj.getElement();
    if (!el) return;

    // If this marker matches (same type & same defIdKey), highlight it
    if (data.type === type && defKey && data[defKey] === id) {
      el.classList.add("marker-highlighted");
      highlightedEls.push(el);
    } else {
      // Otherwise dim it
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
    // Remove all classes after 500ms
    highlightedEls.forEach(el => el.classList.remove("marker-highlighted"));
    dimmedEls.forEach(el      => el.classList.remove("marker-dimmed"));
    highlightedEls = [];
    dimmedEls      = [];

    resetTimerId = null;
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

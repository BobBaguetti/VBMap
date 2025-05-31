// File: src/modules/sidebar/hoverHighlighter.js
// @version: 1

import { allMarkers } from "../../bootstrap/markerLoader.js";
import { markerTypes } from "../marker/types.js";

/**
 * Debounce helper: delays invoking "fn" until after "waitMs" of inactivity.
 * If a new call comes in before waitMs elapses, it resets the timer.
 */
function debounce(fn, waitMs) {
  let timerId = null;
  function wrapper(...args) {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      fn(...args);
    }, waitMs);
  }
  return wrapper;
}

// Arrays to track which marker elements have been styled
let highlightedEls = [];
let dimmedEls      = [];

/**
 * Actually applies CSS classes to highlight matching markers and dim others.
 * @param {string} type  – The marker type (“Item”, “Chest”, “NPC”)
 * @param {string} id    – The definition ID to match against data[defIdKey]
 */
function doHighlight(type, id) {
  // Remove any existing styling
  highlightedEls.forEach(el => el.classList.remove("marker-highlighted"));
  dimmedEls.forEach(el      => el.classList.remove("marker-dimmed"));
  highlightedEls = [];
  dimmedEls      = [];

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

// Debounced version to batch rapid hover events (200ms delay)
const debouncedHighlight = debounce(doHighlight, 200);

/**
 * Public API: call on mouseenter to schedule a highlight.
 * @param {string} type
 * @param {string} id
 */
export function highlightMarkers(type, id) {
  debouncedHighlight(type, id);
}

/**
 * Public API: call on mouseleave to immediately clear all highlight/dim classes.
 */
export function resetMarkerHighlight() {
  // Remove any pending highlight (if desired)
  // You could expand debounce to provide a cancel() method, but immediate removal is fine here.

  highlightedEls.forEach(el => el.classList.remove("marker-highlighted"));
  dimmedEls.forEach(el      => el.classList.remove("marker-dimmed"));
  highlightedEls = [];
  dimmedEls      = [];
}

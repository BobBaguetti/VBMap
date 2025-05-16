// @file: src/bootstrap/events.js
// @version: 1.0 — global DOM events (scrollbars, etc.)

import { activateFloatingScrollbars } from "../modules/utils/scrollUtils.js";

/**
 * Initialize global event listeners.
 */
function init() {
  document.addEventListener("DOMContentLoaded", activateFloatingScrollbars);
}

export default {
  init
};

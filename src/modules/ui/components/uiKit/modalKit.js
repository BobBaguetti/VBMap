// @file: src/modules/ui/components/uiKit/modalKit.js
// @version: 1.3 — re-export core, small, and large modal APIs

// Core (barebones structure + lifecycle)
export {
  createModal,
  openModal,
  closeModal
} from "./modalCore.js";

// Small modal (floating, draggable, positioned)
export {
  createSmallModal,
  openSmallModalAt
} from "./modals/smallModal.js";

// Large modal (centered, backdrop, fixed)
export {
  createLargeModal
} from "./modals/largeModal.js";

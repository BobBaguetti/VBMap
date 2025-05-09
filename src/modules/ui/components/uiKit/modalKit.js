// @file: src/modules/ui/components/uiKit/modalKit.js
// @version: 1.1 — centralize modal APIs

// -- Core (large + small under the hood) --
export { createModal, openModal, closeModal, openModalAt } from "./modalKit.js";

// -- Small modal API --
export { createSmallModal, openSmallModalAt } from "./modals/smallModal.js";

// -- Large modal API --
export { createLargeModal } from "./modals/largeModal.js";

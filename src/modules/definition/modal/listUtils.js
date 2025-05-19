// @file: src/modules/definition/modal/listUtils.js
// @version: 1.0 — extracted from shared/utils/listUtils.js

/**
 * Creates an empty container for listing definitions.
 *
 * @param {string} id – the element ID to assign
 * @returns {HTMLElement}
 */
export function createDefListContainer(id) {
  const div = document.createElement("div");
  div.id = id;
  div.classList.add("def-list");
  return div;
}

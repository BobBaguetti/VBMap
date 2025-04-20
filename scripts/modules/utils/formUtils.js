// @version: 1
// @file: /scripts/modules/ui/formUtils.js

/**
 * Creates a top-aligned label + content field row.
 * Useful for multi-line or dynamic content (e.g. Extra Info blocks).
 *
 * @param {string} labelText - The label to display
 * @param {HTMLElement} contentEl - The element to the right of the label
 * @returns {HTMLDivElement} A top-aligned field row
 */
export function createTopAlignedFieldRow(labelText, contentEl) {
    const row = document.createElement("div");
    row.classList.add("field-row", "extra-row");
  
    const label = document.createElement("label");
    label.textContent = labelText;
  
    row.append(label, contentEl);
    return row;
  }
  
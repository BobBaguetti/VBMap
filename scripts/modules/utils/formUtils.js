// @version: 3
// @file: /scripts/modules/ui/formUtils.js

/**
 * Creates a top-aligned label + content field row.
 * Useful for multi-line or dynamic content (e.g. Extra Info blocks).
 *
 * @param {string} labelText - The label to display
 * @param {HTMLElement} [contentEl] - Optional content element (input, div, etc.)
 * @returns {HTMLDivElement} A top-aligned field row
 */
export function createTopAlignedFieldRow(labelText, contentEl = null) {
    const row = document.createElement("div");
    row.classList.add("field-row", "extra-row");
  
    const label = document.createElement("label");
    label.textContent = labelText;
    label.style.alignSelf = "flex-start";
    label.style.width = "100px";
    label.style.marginRight = "8px";
  
    row.appendChild(label);
  
    // If a content element was provided, style and append it
    if (contentEl) {
      contentEl.style.flex = "1";
      contentEl.style.marginLeft = "0";
      row.appendChild(contentEl);
    }
  
    return row;
  }
  
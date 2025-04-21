// @version: 1
// @file: /scripts/modules/utils/iconUtils.js

/**
 * Creates a Phosphor icon element.
 * Requires Phosphor icons to be available via CSS (e.g., CDN or local import).
 *
 * @param {string} name - Icon name (e.g., "coins", "trash")
 * @param {object} [options] - Optional settings
 * @param {string} [options.className] - Extra classes to apply
 * @param {object} [options.style] - Inline style overrides
 * @returns {HTMLElement} - Configured icon element
 */
export function createIcon(name, options = {}) {
    const el = document.createElement("i");
    el.classList.add("ph", `ph-${name}`);
  
    if (options.className) el.classList.add(...options.className.split(" "));
    if (options.style) Object.assign(el.style, options.style);
  
    return el;
  }
  
  /**
   * Creates a span with optional label text and a trailing icon.
   *
   * @param {string} text - The label text
   * @param {string} iconName - Phosphor icon name
   * @param {object} [options] - Optional settings
   * @param {string} [options.className] - Extra classes for the span
   * @returns {HTMLElement} - Span with icon and text
   */
  export function createLabeledIcon(text, iconName, options = {}) {
    const span = document.createElement("span");
    span.textContent = text;
    span.className = options.className || "";
  
    const icon = createIcon(iconName, { className: "inline-icon" });
    icon.style.marginLeft = "4px";
    span.appendChild(icon);
  
    return span;
  }
  
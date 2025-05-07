// @file: /scripts/modules/ui/components/colorPreview.js
// @version: 1.0 - shared inline color preview with Pickr integration

import { createPickr } from "./pickrUtils.js";

/**
 * Creates a reusable inline color preview that opens a Pickr
 * picker on click and emits change events.
 *
 * @param {Object} opts
 * @param {string} opts.initial  - Initial hex color (e.g. "#E5E6E8")
 * @param {function} opts.onChange - Callback invoked with new hex on change
 * @returns {HTMLElement} A <div class="color-preview"> element
 */
export function createColorPreview({ initial = "#E5E6E8", onChange = () => {} }) {
  // 1) Build the preview element
  const previewEl = document.createElement("div");
  previewEl.className = "color-preview";
  previewEl.style.width = "16px";
  previewEl.style.height = "16px";
  previewEl.style.border = "1px solid #ccc";
  previewEl.style.cursor = "pointer";
  previewEl.style.backgroundColor = initial;

  // Ensure a stable ID for Pickr attachment
  if (!previewEl.id) {
    previewEl.id = `color-preview-${Math.random().toString(36).slice(2, 8)}`;
  }

  // 2) Initialize Pickr instance
  const pickr = createPickr(`#${previewEl.id}`, initial);

  // Sync Pickr changes back to previewEl and invoke callback
  pickr.on("change", (color, instance) => {
    const hex = instance.getColor().toHEXA().toString();
    previewEl.style.backgroundColor = hex;
    onChange(hex);
    // Emit a DOM input event for form integration
    previewEl.dispatchEvent(new Event("input", { bubbles: true }));
  });

  // 3) Show picker on click
  previewEl.addEventListener("click", () => {
    pickr.show();
  });

  return previewEl;
}

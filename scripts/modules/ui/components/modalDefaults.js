// @file: /scripts/modules/ui/components/modalDefaults.js
// @version: 1.1 – added renderToolbarButton

import { createIcon } from "./domUtils.js";

/**
 * Global toolbar buttons for definition modals.
 * Each entry: { icon?: string, label: string, onClick: (api:Object)=>void }
 * Entity-specific toolbars can extend or override this.
 */
export const defaultToolbar = [];

/**
 * Layout options for the layout switcher.
 * Default views for list entries.
 */
export const defaultLayoutOptions = ["row", "stacked", "gallery"];

/**
 * Placeholder text for search inputs in definition lists.
 */
export const defaultSearchPlaceholder = "Search…";

/**
 * Default color for Pickr instances (e.g. for extra-info, color swatches).
 */
export const defaultPickrColor = "#E5E6E8";

/**
 * Default labels for form buttons.
 */
export const defaultFormButtonLabels = {
  save:   "Save",
  cancel: "Cancel",
  delete: "Delete"
};

/**
 * Renders a single toolbar button into the modal header.
 *
 * @param {{ icon?: string, label: string, onClick: (api:Object)=>void }} cfg
 * @param {HTMLElement} headerEl  – the modal header element to append into
 * @param {Object} api            – passed through to onClick
 */
export function renderToolbarButton(cfg, headerEl, api) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "toolbar-button";
  if (cfg.icon) {
    // inline icon preferred
    const iconEl = createIcon(cfg.icon, { inline: true, className: "inline-icon" });
    btn.appendChild(iconEl);
    if (cfg.label) {
      const text = document.createTextNode(" " + cfg.label);
      btn.appendChild(text);
    }
  } else {
    btn.textContent = cfg.label;
  }
  btn.onclick = () => cfg.onClick(api);
  headerEl.appendChild(btn);
}

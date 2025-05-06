// @file: /scripts/modules/ui/components/modalDefaults.js
// @version: 1.2 – add renderToolbarButton and fix import paths

import { createIcon } from "../../utils/domUtils.js";

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
 * Renders a toolbar button into a modal header.
 *
 * @param {{ icon?: string, label: string, onClick: (api:Object)=>void }} cfg
 * @param {HTMLElement} headerEl
 * @param {Object} api  – whatever you want to pass through (e.g. { shell, formApi })
 */
export function renderToolbarButton(cfg, headerEl, api = {}) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "toolbar-button";

  // Icon (inline SVG or font icon)
  if (cfg.icon) {
    const iconEl = createIcon(cfg.icon, { inline: true, className: "toolbar-icon" });
    btn.appendChild(iconEl);
  }

  // Label
  const text = document.createElement("span");
  text.textContent = cfg.label;
  btn.appendChild(text);

  // Click handler
  btn.addEventListener("click", () => {
    try {
      cfg.onClick(api);
    } catch (err) {
      console.error("Toolbar button error:", err);
    }
  });

  headerEl.appendChild(btn);
}

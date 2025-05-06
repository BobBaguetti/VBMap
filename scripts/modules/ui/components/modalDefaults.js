// @file: /scripts/modules/ui/components/modalDefaults.js
// @version: 1.0 - central configuration for all definition modals

/**
 * Global toolbar buttons for definition modals.
 * Each entry: { icon?: string, label: string, onClick: () => void }
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

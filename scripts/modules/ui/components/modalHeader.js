// @file: /scripts/modules/ui/components/modalHeader.js
// @version: 1.0 – shared modal header builder

import { renderToolbarButton } from "./modalToolbar.js"; // or your existing helper
import { createLayoutSwitcher } from "./layoutSwitcher.js";

/**
 * Build the header for a CRUD modal.
 *
 * @param {HTMLElement} headerEl   – the container to populate
 * @param {Object} opts
 * @param {string} opts.title      – modal title text
 * @param {Array}  [opts.toolbar]  – toolbar button configs
 * @param {Array}  [opts.layoutOptions] – layout names
 * @param {Function} opts.onLayoutChange
 * @param {string} [opts.searchPlaceholder]
 * @param {HTMLElement} [opts.searchEl]     – prebuilt search input node
 * @param {HTMLElement} [opts.subHeaderEl]  – prebuilt form sub-header node
 */
export function buildModalHeader(
  headerEl,
  {
    title,
    toolbar = [],
    layoutOptions = [],
    onLayoutChange = () => {},
    searchPlaceholder = "Search…",
    searchEl = null,
    subHeaderEl = null
  }
) {
  // 1) Title + close (assumes close btn is already in headerEl from core)
  const titleEl = document.createElement("h2");
  titleEl.textContent = title;
  headerEl.insertBefore(titleEl, headerEl.firstChild);

  // 2) Toolbar
  if (toolbar.length) {
    const tb = document.createElement("div");
    tb.className = "modal-toolbar";
    toolbar.forEach(cfg => renderToolbarButton(cfg, tb));
    headerEl.appendChild(tb);
  }

  // 3) Layout switcher
  if (layoutOptions.length) {
    const switcher = createLayoutSwitcher({
      available:   layoutOptions,
      defaultView: layoutOptions[0],
      onChange:    onLayoutChange
    });
    headerEl.appendChild(switcher);
  }

  // 4) Search input
  if (searchEl) {
    headerEl.appendChild(searchEl);
  } else {
    // Optionally, you could build a default <input> here
  }

  // 5) Sub-header (e.g. form add/edit bar)
  if (subHeaderEl) {
    headerEl.appendChild(subHeaderEl);
  }
}

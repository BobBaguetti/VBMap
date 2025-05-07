// @file: /scripts/modules/ui/components/modalHeader.js
// @version: 1.1 – toolbar & layout only (no title/search/subheader)

import { renderToolbarButton } from "./modalToolbar.js";
import { createLayoutSwitcher } from "./layoutSwitcher.js";

/**
 * Build the header for a CRUD modal.
 *
 * @param {HTMLElement} headerEl   – the container to populate; already has title & close
 * @param {Object} opts
 * @param {Array}  [opts.toolbar]       – toolbar button configs
 * @param {Array<string>} [opts.layoutOptions] – layout names
 * @param {Function} opts.onLayoutChange – called on layout switch
 */
export function buildModalHeader(headerEl, {
  toolbar = [],
  layoutOptions = [],
  onLayoutChange = () => {}
}) {
  // 1) Toolbar
  if (toolbar.length) {
    const tb = document.createElement("div");
    tb.className = "modal-toolbar";
    toolbar.forEach(cfg => renderToolbarButton(cfg, tb));
    headerEl.appendChild(tb);
  }

  // 2) Layout switcher
  if (layoutOptions.length) {
    const switcher = createLayoutSwitcher({
      available:   layoutOptions,
      defaultView: layoutOptions[0],
      onChange:    onLayoutChange
    });
    headerEl.appendChild(switcher);
  }
}

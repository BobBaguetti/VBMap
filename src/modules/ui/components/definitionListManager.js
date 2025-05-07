// @file: src/modules/ui/components/definitionListManager.js
// @version: 6.0 — no internal search, external filter API

import { renderItemEntry } from "../entries/itemEntryRenderer.js";

/**
 * Creates and manages a sortable, filterable definition list.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container      — the <div> that will hold entries
 * @param {() => Array}   options.getDefinitions — function returning all defs
 * @param {(def:Object) => void} options.onEntryClick
 * @param {(id:string) => Promise<void>} options.onDelete
 * @param {() => string} [options.getCurrentLayout]
 */
export function createDefinitionListManager({
  container,
  getDefinitions,
  onEntryClick,
  onDelete,
  getCurrentLayout = () => "row"
}) {
  let layout    = getCurrentLayout();
  let filterTerm = "";

  function render() {
    const data = getDefinitions();
    const q = filterTerm.trim().toLowerCase();

    const filtered = data.filter(d =>
      d.name?.toLowerCase().includes(q)
    );

    container.innerHTML = "";
    container.className = `def-list ui-scroll-float layout-${layout}`;

    filtered.forEach(def => {
      const entry = renderItemEntry(def, layout, onEntryClick, onDelete);
      container.appendChild(entry);
    });
  }

  return {
    /** Refresh the list (e.g. after data changes) */
    refresh: render,

    /** Change layout: "row", "gallery", etc. */
    setLayout(newLayout) {
      layout = newLayout;
      render();
    },

    /** Set the current filter term (from an external search box) */
    filter(term) {
      filterTerm = term || "";
      render();
    }
  };
}

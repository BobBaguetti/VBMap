// @version: 6.2
// @file: /scripts/modules/ui/components/definitionListManager.js

import { renderItemEntry } from "../entries/itemEntryRenderer.js";

/**
 * Creates and manages a sortable, searchable definition list.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container
 * @param {() => Array} options.getDefinitions
 * @param {(def: Object, layout: string, onClick: Function, onDelete: Function) => HTMLElement} 
 *                  [options.renderEntry]        – custom entry‐renderer; defaults to renderItemEntry
 * @param {(def: Object) => void} [options.onEntryClick] – optional list‐level click hook
 * @param {(id: string) => Promise<void>} [options.onDelete] 
 *                  – optional list‐level delete hook
 * @param {() => string} [options.getCurrentLayout]
 */
export function createDefinitionListManager({
  container,
  getDefinitions,
  renderEntry = renderItemEntry,
  onEntryClick = () => {},
  onDelete = () => Promise.resolve(),
  getCurrentLayout = () => "row"
}) {
  let layout = getCurrentLayout();

  // Build and insert the search header
  const header = document.createElement("div");
  header.className = "list-header";
  const searchInput = document.createElement("input");
  searchInput.className = "ui-input";
  searchInput.placeholder = "Search…";
  searchInput.addEventListener("input", render);
  header.appendChild(searchInput);
  container.parentNode.insertBefore(header, container);

  // Render function
  function render() {
    const allDefs = getDefinitions();
    const query = searchInput.value.trim().toLowerCase();
    const filtered = allDefs.filter(d =>
      d.name?.toLowerCase().includes(query)
    );

    container.innerHTML = "";
    container.className = `def-list ui-scroll-float layout-${layout}`;

    filtered.forEach(def => {
      // positional signature: (def, layout, onClick, onDelete)
      const entryEl = renderEntry(
        def,
        layout,
        () => onEntryClick(def),
        id => onDelete(id)
      );
      container.appendChild(entryEl);
    });
  }

  return {
    refresh: render,
    setLayout(newLayout) {
      layout = newLayout;
      render();
    }
  };
}

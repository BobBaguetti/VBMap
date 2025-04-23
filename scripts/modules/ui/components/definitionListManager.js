// @file: /scripts/modules/utils/definitionListManager.js
// @version: 5

import { renderItemEntry } from "../entries/itemEntryRenderer.js";

/**
 * Creates and manages a sortable, searchable definition list.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container
 * @param {() => Array} options.getDefinitions
 * @param {(def: Object) => void} options.onEntryClick
 * @param {(id: string) => Promise<void>} options.onDelete
 * @param {() => string} [options.getCurrentLayout]
 */
export function createDefinitionListManager({
  container,
  getDefinitions,
  onEntryClick,
  onDelete,
  getCurrentLayout = () => "row"
}) {
  let layout = getCurrentLayout();

  function render() {
    const data = getDefinitions();
    const q = searchInput.value.trim().toLowerCase();

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

  const header = document.createElement("div");
  header.className = "list-header";

  const searchInput = document.createElement("input");
  searchInput.className = "ui-input";
  searchInput.placeholder = "Search items...";
  searchInput.addEventListener("input", render);
  header.appendChild(searchInput);

  container.parentNode.insertBefore(header, container);

  return {
    refresh: render,
    setLayout: newLayout => {
      layout = newLayout;
      render();
    }
  };
}

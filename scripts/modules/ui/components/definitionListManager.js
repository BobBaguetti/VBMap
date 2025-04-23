// @version: 4
// @file: /scripts/modules/utils/definitionListManager.js

import { createItemEntry } from "./itemEntryRenderer.js";

/**
 * Creates and manages a sortable, searchable definition list.
 *
 * @param {{
 *   container: HTMLElement,
 *   getDefinitions: () => Array,
 *   onEntryClick: (def: Object) => void,
 *   onDelete: (id: string) => Promise<void>,
 *   getCurrentLayout?: () => string
 * }} options
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
      const entry = createItemEntry(def, layout, onEntryClick, onDelete);
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

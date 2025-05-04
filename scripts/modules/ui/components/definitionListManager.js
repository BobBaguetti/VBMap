// @file: /scripts/modules/ui/components/definitionListManager.js
// @version: 8 – full backward compatibility + custom renderer support

import { renderItemEntry } from "../entries/itemEntryRenderer.js";

/**
 * Creates and manages a sortable, searchable definition list.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container
 * @param {() => Array} options.getDefinitions
 * @param {(def: Object, layout: string, cbs: {onClick:Function, onDelete:Function}) => HTMLElement}
 *                  [options.renderEntry] – custom entry renderer; defaults to items
 * @param {(def: Object) => void} [options.onEntryClick] – legacy click hook
 * @param {(id: string) => Promise<void>} [options.onDelete] – legacy delete hook
 * @param {() => string} [options.getCurrentLayout]
 */
export function createDefinitionListManager({
  container,
  getDefinitions,
  renderEntry = (def, layout, { onClick, onDelete }) =>
    // default: adapt old-style renderItemEntry
    renderItemEntry(def, layout, onClick, onDelete),
  onEntryClick = () => {},
  onDelete = () => Promise.resolve(),
  getCurrentLayout = () => "row"
}) {
  let layout = getCurrentLayout();

  // build & insert the search header
  const header = document.createElement("div");
  header.className = "list-header";
  const searchInput = document.createElement("input");
  searchInput.className = "ui-input";
  searchInput.placeholder = "Search…";
  searchInput.addEventListener("input", render);
  header.appendChild(searchInput);
  container.parentNode.insertBefore(header, container);

  // main render function
  function render() {
    const allDefs = getDefinitions();
    const q = searchInput.value.trim().toLowerCase();
    const filtered = allDefs.filter(d =>
      d.name?.toLowerCase().includes(q)
    );

    container.innerHTML = "";
    container.className = `def-list ui-scroll-float layout-${layout}`;

    filtered.forEach(def => {
      // call the appropriate renderer
      const entryEl = renderEntry(def, layout, {
        onClick: () => {
          onEntryClick(def);
        },
        onDelete: () => {
          onDelete(def.id);
        }
      });
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

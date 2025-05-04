// @version: 6.1
// @file: /scripts/modules/ui/components/definitionListManager.js

/**
 * Creates and manages a sortable, searchable definition list.
 *
 * @param {Object} options
 * @param {HTMLElement}                          options.container
 * @param {() => Array}                          options.getDefinitions
 * @param {(def: Object, layout: string, cbs: {onClick:Function, onDelete:Function}) => HTMLElement} 
 *                                              options.renderEntry
 * @param {(def: Object) => void}                options.onEntryClick
 * @param {(id: string) => Promise<void>}        options.onDelete
 * @param {() => string}                         [options.getCurrentLayout]
 */
export function createDefinitionListManager({
  container,
  getDefinitions,
  renderEntry,
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
      // pass def + layout + callback-object to your renderer
      const entryEl = renderEntry(def, layout, {
        onClick: () => onEntryClick?.(def),
        onDelete: () => onDelete(def.id)
      });
      container.appendChild(entryEl);
    });
  }

  // build & insert the search header
  const header = document.createElement("div");
  header.className = "list-header";

  const searchInput = document.createElement("input");
  searchInput.className = "ui-input";
  searchInput.placeholder = "Search…";
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

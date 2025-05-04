// @file: /scripts/modules/ui/components/definitionListManager.js
// @version: 8 – full support for custom renderEntry(def, layout, {onClick,onDelete})

/**
 * Creates and manages a sortable, searchable definition list.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container
 * @param {() => Array} options.getDefinitions
 * @param {(def: Object, layout: string, cbs: {onClick:Function, onDelete:Function}) => HTMLElement}
 *                  options.renderEntry – **required** entry renderer
 * @param {() => string} [options.getCurrentLayout]
 */
export function createDefinitionListManager({
  container,
  getDefinitions,
  renderEntry,
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
      // call the custom renderer passed by the modal factory
      const entryEl = renderEntry(def, layout, {
        onClick: () => renderOrHighlight(def),
        onDelete: () => deleteOrRefresh(def.id)
      });
      container.appendChild(entryEl);
    });
  }

  // no-op placeholders; they can be hooked if needed
  function renderOrHighlight(def) { /* highlighting if you add it */ }
  function deleteOrRefresh(id) { /* extra deletion logic if you add it */ }

  return {
    refresh: render,
    setLayout(newLayout) {
      layout = newLayout;
      render();
    }
  };
}

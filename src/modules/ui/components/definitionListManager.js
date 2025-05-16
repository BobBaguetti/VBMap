// @file: src/modules/ui/components/definitionListManager.js
// @version: 6.3 — inline default simple renderer when none provided

/**
 * Creates and manages a sortable, filterable definition list.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container        — the <div> that will hold entries
 * @param {() => Array}   options.getDefinitions — function returning all defs
 * @param {(def:Object) => void} options.onEntryClick
 * @param {(id:string) => Promise<void>} options.onDelete
 * @param {() => string} [options.getCurrentLayout]
 * @param {(def, layout, onClick, onDelete) => HTMLElement} [options.renderEntry]
 *        Optional custom renderer. If omitted, a simple default is used.
 */
export function createDefinitionListManager({
  container,
  getDefinitions,
  onEntryClick,
  onDelete,
  getCurrentLayout = () => "row",
  renderEntry
}) {
  let layout     = getCurrentLayout();
  let filterTerm = "";

  // Simple default renderer
  function defaultRenderer(def, layout, onClick, onDelete) {
    const entry = document.createElement("div");
    entry.className = `def-entry layout-${layout}`;
    entry.textContent = def.name || "(no name)";
    entry.style.cursor = "pointer";

    entry.addEventListener("click", () => onClick(def));

    const del = document.createElement("button");
    del.textContent = "×";
    del.title = "Delete";
    del.style.marginLeft = "8px";
    del.addEventListener("click", e => {
      e.stopPropagation();
      onDelete(def.id);
    });
    entry.appendChild(del);

    return entry;
  }

  function render() {
    const data = getDefinitions();
    const q = filterTerm.trim().toLowerCase();

    const filtered = data.filter(d =>
      d.name?.toLowerCase().includes(q)
    );

    container.innerHTML = "";
    container.className = `def-list layout-${layout}`;

    filtered.forEach(def => {
      const renderer = typeof renderEntry === "function"
        ? renderEntry
        : defaultRenderer;
      const entry = renderer(def, layout, onEntryClick, onDelete);
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

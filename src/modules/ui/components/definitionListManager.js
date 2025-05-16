// @file: src/modules/ui/components/definitionListManager.js
// @version: 6.4 — improved default entry styling

/**
 * Creates and manages a sortable, filterable definition list.
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

  // Enhanced default renderer
  function defaultRenderer(def, layout, onClick, onDelete) {
    // wrapper
    const entry = document.createElement("div");
    entry.className = `def-entry def-entry--${layout}`;
    entry.style.display = "flex";
    entry.style.alignItems = "center";
    entry.style.justifyContent = "space-between";
    entry.style.padding = "0.4em 0.6em";
    entry.style.margin = "0.2em 0";
    entry.style.background = "var(--bg-20)";
    entry.style.borderRadius = "4px";
    entry.style.cursor = "pointer";

    // name
    const nameSpan = document.createElement("span");
    nameSpan.textContent = def.name || "(no name)";
    nameSpan.style.flex = "1";
    entry.appendChild(nameSpan);

    // delete button
    const delBtn = document.createElement("button");
    delBtn.className = "ui-button-delete";
    delBtn.textContent = "×";
    delBtn.title = "Delete";
    delBtn.style.marginLeft = "0.5em";
    delBtn.onclick = e => {
      e.stopPropagation();
      onDelete(def.id);
    };
    entry.appendChild(delBtn);

    // click handler
    entry.addEventListener("click", () => onClick(def));
    return entry;
  }

  function render() {
    const data = getDefinitions();
    const q = filterTerm.trim().toLowerCase();
    const filtered = data.filter(d =>
      d.name?.toLowerCase().includes(q)
    );

    container.innerHTML = "";
    filtered.forEach(def => {
      const renderer = typeof renderEntry === "function"
        ? renderEntry
        : defaultRenderer;
      container.appendChild(
        renderer(def, layout, onEntryClick, onDelete)
      );
    });
  }

  return {
    refresh: render,
    setLayout(newLayout) {
      layout = newLayout;
      render();
    },
    filter(term) {
      filterTerm = term || "";
      render();
    }
  };
}

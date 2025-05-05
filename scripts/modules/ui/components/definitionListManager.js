// @file: /scripts/modules/ui/components/definitionListManager.js
// @version: 8 – full custom renderer support with object-style callbacks

import { renderItemEntry } from "../entries/itemEntryRenderer.js";

export function createDefinitionListManager({
  container,
  getDefinitions,
  renderEntry = (def, layout, { onClick, onDelete }) =>
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

  function render() {
    const allDefs = getDefinitions();
    const q = searchInput.value.trim().toLowerCase();
    const filtered = allDefs.filter(d =>
      d.name?.toLowerCase().includes(q)
    );

    container.innerHTML = "";
    container.className = `def-list ui-scroll-float layout-${layout}`;

    filtered.forEach(def => {
      const entryEl = renderEntry(def, layout, {
        onClick: () => onEntryClick(def),
        onDelete: () => onDelete(def.id)
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

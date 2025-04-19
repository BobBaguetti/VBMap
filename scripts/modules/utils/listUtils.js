// @version: 1
// @file: /scripts/modules/utils/listUtils.js

import { createFilterButtonGroup, createSearchRow } from "../ui/uiKit.js";

/**
 * Creates a container <div> for your definition list.
 * @param {string} id – the element ID to assign.
 * @returns {HTMLElement}
 */
export function createDefListContainer(id) {
  const div = document.createElement("div");
  div.id = id;
  div.classList.add("def-list");
  return div;
}

/**
 * Builds a filterable & sortable list UI.
 *
 * @param {HTMLElement} container        – where to render entries
 * @param {Array}         initialData    – full array of items
 * @param {Object}        sortFns        – map button‑ID → (a,b)=>number
 * @param {Function}      renderEntry    – (item)=>HTMLElement
 * @param {Object}        options        – { filters: [{id,label}], searchPlaceholder }
 *
 * @returns {{
 *   refresh(newData: Array): void,
 *   open(): void,
 *   activeSorts: Set<string>
 * }}
 */
export function createFilterableList(
  container,
  initialData,
  sortFns,
  renderEntry,
  { filters, searchPlaceholder }
) {
  // 1) Make header row
  const header = document.createElement("div");
  header.classList.add("list-header");

  // 1a) Filter buttons
  const { wrapper: filterWrapper } = createFilterButtonGroup(filters, (id, toggled) => {
    if (toggled) activeSorts.add(id);
    else          activeSorts.delete(id);
    render();
  });
  header.append(filterWrapper);

  // 1b) Search input
  const { row: searchRow, input: searchInput } =
    createSearchRow(`${container.id}-search`, searchPlaceholder);
  searchInput.addEventListener("input", () => render());
  header.append(searchRow);

  container.parentNode.insertBefore(header, container);

  // 2) Internal state
  let data = [...initialData];
  const activeSorts = new Set();

  // 3) Core render
  function render() {
    // 3a) Filter by search
    const q = searchInput.value.trim().toLowerCase();
    let list = data.filter(item =>
      (item.name || "").toLowerCase().includes(q)
    );

    // 3b) Apply each active sort
    activeSorts.forEach(id => {
      const fn = sortFns[id];
      if (fn) list.sort(fn);
    });

    // 3c) Populate container
    container.innerHTML = "";
    list.forEach(item => {
      container.appendChild(renderEntry(item));
    });
  }

  // 4) Public API
  function refresh(newData) {
    data = [...newData];
    render();
  }
  function open() {
    render();
    const modal = container.closest(".modal");
    if (modal) modal.style.display = "block";
  }

  return { refresh, open, activeSorts };
}

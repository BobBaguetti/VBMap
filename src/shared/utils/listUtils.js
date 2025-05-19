/**
 * src\shared\utils\listUtils.js
 * 
 * Builds a row of filter buttons.
 *
 * @param {Array<{id:string,label:string}>} filters
 * @param {(id:string, toggled:boolean)=>void} onToggle
 * @returns {{ wrapper: HTMLElement }}
 */
export function createFilterButtonGroup(filters, onToggle) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("filter-buttons");
  filters.forEach(({ id, label }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = id;
    btn.classList.add("filter-btn");
    btn.textContent = label;
    btn.addEventListener("click", () => {
      const toggled = btn.classList.toggle("toggled");
      onToggle(id, toggled);
    });
    wrapper.appendChild(btn);
  });
  return { wrapper };
}

/**
 * Builds a search input row.
 *
 * @param {string} inputId
 * @param {string} placeholder
 * @returns {{ row: HTMLElement, input: HTMLInputElement }}
 */
export function createSearchRow(inputId, placeholder) {
  const row = document.createElement("div");
  row.classList.add("list-search");
  const input = document.createElement("input");
  input.type = "text";
  input.id = inputId;
  input.placeholder = placeholder;
  input.classList.add("ui-input");
  row.appendChild(input);
  return { row, input };
}

/**
 * Creates an empty container for listing definitions.
 *
 * @param {string} id – the element ID to assign
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
 * @param {HTMLElement} container
 * @param {Array} initialData
 * @param {Object} sortFns
 * @param {Function} renderEntry
 * @param {Object} options
 * @param {Array} options.filters
 * @param {string} options.searchPlaceholder
 * @param {boolean} [options.showFilters=true]
 * @returns {{ refresh(newData: Array): void, open(): void, activeSorts: Set<string> }}
 */
export function createFilterableList(
  container,
  initialData,
  sortFns,
  renderEntry,
  {
    filters = [],
    searchPlaceholder = "Search...",
    showFilters = true
  } = {}
) {
  // 1) Header wrapper
  const header = document.createElement("div");
  header.classList.add("list-header");

  // 1a) Optional Filter buttons
  let activeSorts = new Set();
  if (showFilters && filters.length > 0) {
    const { wrapper: filterWrapper } = createFilterButtonGroup(filters, (id, toggled) => {
      if (toggled) activeSorts.add(id);
      else activeSorts.delete(id);
      render();
    });
    header.appendChild(filterWrapper);
  }

  // 1b) Search row
  const { row: searchRow, input: searchInput } =
    createSearchRow(`${container.id}-search`, searchPlaceholder);
  searchInput.addEventListener("input", render);
  header.appendChild(searchRow);

  // Insert header before container
  container.parentNode.insertBefore(header, container);

  // 2) State
  let data = [...initialData];

  // 3) Core render
  function render() {
    const q = searchInput.value.trim().toLowerCase();
    let list = data.filter(item =>
      (item.name || "").toLowerCase().includes(q)
    );
    activeSorts.forEach(id => {
      const fn = sortFns[id];
      if (fn) list.sort(fn);
    });
    container.innerHTML = "";
    list.forEach(item => {
      container.appendChild(renderEntry(item));
    });
  }

  // 4) API
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

// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.7 — collapse‐all button with toggle & animation

/**
 * Wire up basic sidebar UI interactions:
 *  - Search‐bar styling
 *  - Sidebar toggle (show/hide)
 *  - Collapsible filter groups (h3/h4 headers)
 *  - “Eye” icons on each group header
 *  - Toggle All & Collapse All for Filters section
 *
 * @param {{ map: L.Map, sidebarSelector: string, toggleSelector: string, searchBarSelector: string, filterGroupSelector: string }} opts
 */
export function setupSidebarUI({
  map,
  sidebarSelector     = "#sidebar",
  toggleSelector      = "#sidebar-toggle",
  searchBarSelector   = "#search-bar",
  filterGroupSelector = ".filter-group"
}) {
  const sidebar       = document.querySelector(sidebarSelector);
  const sidebarToggle = document.querySelector(toggleSelector);
  const searchBar     = document.querySelector(searchBarSelector);

  if (!sidebar || !sidebarToggle || !searchBar) {
    console.warn("[sidebarUI] Missing elements");
    return;
  }

  // 1) Style the search bar
  searchBar.classList.add("ui-input");

  // 2) Toggle sidebar open/closed
  sidebarToggle.textContent = "◀︎";
  sidebarToggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("hidden");
    sidebarToggle.style.left  = hidden ? "0px" : `${sidebar.offsetWidth}px`;
    sidebarToggle.textContent = hidden ? "▶︎" : "◀︎";
    map.invalidateSize();
  });

  // 3) Collapse & eye‐toggle for every filter‐group
  document.querySelectorAll(filterGroupSelector).forEach(group => {
    const header = group.querySelector("h3, h4");
    if (!header) return;

    // 3a) Collapse on header click
    header.addEventListener("click", () => {
      group.classList.toggle("collapsed");
    });

    // 3b) Inject the eye icon
    const eye = document.createElement("i");
    eye.classList.add("fas", "fa-eye", "filter-eye");
    eye.style.cursor     = "pointer";
    eye.style.marginLeft = "0.5em";
    header.appendChild(eye);

    // Toggle all child checkboxes
    eye.addEventListener("click", e => {
      e.stopPropagation();
      const inputs = group.querySelectorAll("input[type=checkbox]");
      const anyOff = [...inputs].some(cb => !cb.checked);
      inputs.forEach(cb => {
        cb.checked = anyOff;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      });
      eye.classList.toggle("fa-eye-slash", !anyOff);
      eye.classList.toggle("fa-eye", anyOff);
    });
  });

  // 4) Toggle All & Collapse All for Filters section
  const filtersHeader = document.querySelector('#filters-section > h2');
  if (filtersHeader) {
    // Toggle All link
    const toggleAllLink = document.createElement('a');
    toggleAllLink.textContent = 'Toggle All';
    toggleAllLink.classList.add('toggle-all');
    toggleAllLink.style.marginLeft = '1em';
    toggleAllLink.style.cursor     = 'pointer';
    filtersHeader.appendChild(toggleAllLink);

    toggleAllLink.addEventListener('click', e => {
      e.stopPropagation();
      const cbs = Array.from(
        document.querySelectorAll('#filters-section .toggle-group input[type=checkbox]')
      );
      if (!cbs.length) return;
      const anyOff = cbs.some(cb => !cb.checked);
      cbs.forEach(cb => {
        cb.checked = anyOff;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    // Collapse All toggle‐button
    const collapseBtn = document.createElement('i');
    collapseBtn.classList.add('fas', 'collapse-all');
    collapseBtn.style.marginLeft = '0.5em';
    collapseBtn.style.cursor     = 'pointer';
    filtersHeader.appendChild(collapseBtn);

    const subGroups = () =>
      Array.from(document.querySelectorAll('#filters-section > .filter-group'));

    const updateCollapseIcon = () => {
      // if *all* subgroups are collapsed, show "down" (fa-chevron-down) to indicate expand
      const allCollapsed = subGroups().every(g => g.classList.contains('collapsed'));
      collapseBtn.classList.toggle('fa-chevron-down', allCollapsed);
      collapseBtn.classList.toggle('fa-chevron-up', !allCollapsed);
    };

    collapseBtn.addEventListener('click', e => {
      e.stopPropagation();
      const groups = subGroups();
      const allCollapsed = groups.every(g => g.classList.contains('collapsed'));
      // if all are collapsed, expand all (remove collapsed); otherwise collapse all
      groups.forEach(g => g.classList.toggle('collapsed', allCollapsed));
      updateCollapseIcon();
    });

    // initialize icon state
    updateCollapseIcon();
  }
}

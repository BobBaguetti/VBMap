// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.3 — add “Toggle All” link to Filters header

/**
 * Wire up basic sidebar UI interactions:
 *  - Search‐bar styling
 *  - Sidebar toggle (show/hide)
 *  - Collapsible filter groups (h3/h4 headers)
 *  - “Eye” icons on each group header
 *  - Show All / Hide All bulk‐toggle links
 *  - **New**: Toggle All for Filters section
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
    eye.style.cursor      = "pointer";
    eye.style.marginLeft  = "0.5em";
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

    // 3c) Show All / Hide All links
    const container = document.createElement("span");
    container.classList.add("header-actions");

    const showAll = document.createElement("a");
    showAll.textContent = "Show All";
    showAll.href = "#";
    showAll.classList.add("show-all");
    showAll.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation();
      group.querySelectorAll("input[type=checkbox]").forEach(cb => {
        if (!cb.checked) {
          cb.checked = true;
          cb.dispatchEvent(new Event("change",{bubbles:true}));
        }
      });
      updateLinks();
    });

    const hideAll = document.createElement("a");
    hideAll.textContent = "Hide All";
    hideAll.href = "#";
    hideAll.classList.add("hide-all");
    hideAll.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation();
      group.querySelectorAll("input[type=checkbox]").forEach(cb => {
        if (cb.checked) {
          cb.checked = false;
          cb.dispatchEvent(new Event("change",{bubbles:true}));
        }
      });
      updateLinks();
    });

    container.append(showAll, hideAll);
    header.appendChild(container);

    // Keep Show/Hide links in sync
    function updateLinks() {
      const inputs = Array.from(group.querySelectorAll("input[type=checkbox]"));
      const allOn = inputs.every(cb => cb.checked);
      showAll.style.display = allOn ? "none" : "inline";
      hideAll.style.display = allOn ? "inline" : "none";
    }

    updateLinks();
    group.querySelectorAll("input[type=checkbox]")
         .forEach(cb => cb.addEventListener("change", updateLinks));
  });

  // 4) Toggle All for Filters section
  const filtersHeader = document.querySelector('#filters-section > h2');
  if (filtersHeader) {
    const toggleAllLink = document.createElement('a');
    toggleAllLink.textContent = 'Toggle All';
    toggleAllLink.classList.add('toggle-all');
    toggleAllLink.style.marginLeft = '1em';
    toggleAllLink.style.cursor = 'pointer';
    filtersHeader.appendChild(toggleAllLink);

    toggleAllLink.addEventListener('click', e => {
      e.stopPropagation();
      const cbs = Array.from(
        document.querySelectorAll('#filters-section .toggle-group input[type=checkbox]')
      );
      if (cbs.length === 0) return;
      const anyOff = cbs.some(cb => !cb.checked);
      cbs.forEach(cb => {
        cb.checked = anyOff;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }
}

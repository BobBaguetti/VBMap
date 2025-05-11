// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.3 — add collapse-all control to Filters section

/**
 * Wire up basic sidebar UI interactions:
 *  - Search‐bar styling
 *  - Sidebar toggle (show/hide)
 *  - Collapsible filter groups (h3/h4 headers)
 *  - “Eye” icons on each group header
 *  - Show All / Hide All bulk‐toggle links
 *  - **New**: Collapse-all button for Filters section
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

  // ─── Collapse-All Control for Filters ───────────────────────────
  const filtersH2 = document.querySelector("#sidebar .sidebar-section > h2");
  if (filtersH2) {
    const collapseAllBtn = document.createElement("i");
    collapseAllBtn.classList.add("fas", "fa-chevron-down", "filter-collapse-all");
    collapseAllBtn.style.cursor = "pointer";
    collapseAllBtn.style.marginLeft = "0.5em";
    filtersH2.appendChild(collapseAllBtn);

    let allCollapsed = false;
    collapseAllBtn.addEventListener("click", e => {
      e.stopPropagation();
      allCollapsed = !allCollapsed;
      // Toggle each top-level filter-group
      ["main-filters","item-filters","chest-filters","npc-filters"].forEach(id => {
        const grp = document.getElementById(id);
        if (grp) grp.classList.toggle("collapsed", allCollapsed);
      });
      // Swap arrow direction
      collapseAllBtn.classList.toggle("fa-chevron-right", allCollapsed);
      collapseAllBtn.classList.toggle("fa-chevron-down",  !allCollapsed);
    });
  }

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
    // Find the header (either h3 or h4)
    const header = group.querySelector("h3, h4");
    if (!header) return;

    // 3a) Collapse on header click
    header.addEventListener("click", () => {
      group.classList.toggle("collapsed");
    });

    // 3b) Eye icon bulk-toggle
    const eye = document.createElement("i");
    eye.classList.add("fas","fa-eye","filter-eye");
    eye.tabIndex = 0;
    eye.setAttribute("aria-label", "Toggle all");
    header.appendChild(eye);
    eye.addEventListener("click", e => {
      e.stopPropagation();
      const inputs = group.querySelectorAll("input[type=checkbox]");
      const anyOff = Array.from(inputs).some(cb => !cb.checked);
      inputs.forEach(cb => {
        cb.checked = anyOff;
        cb.dispatchEvent(new Event("change",{bubbles:true}));
      });
      eye.classList.toggle("fa-eye-slash", !anyOff);
      eye.classList.toggle("fa-eye", anyOff);
    });

    // 3c) Show All / Hide All links (unchanged)
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

    function updateLinks() {
      const inputs = Array.from(group.querySelectorAll("input[type=checkbox]"));
      const allOn = inputs.every(cb => cb.checked);
      showAll.style.display = allOn ? "none" : "inline";
      hideAll.style.display = allOn ? "inline" : "none";
    }

    // initialize and keep in sync
    updateLinks();
    group.querySelectorAll("input[type=checkbox]")
         .forEach(cb => cb.addEventListener("change", updateLinks));
  });
}

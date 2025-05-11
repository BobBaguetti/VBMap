// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.7 — sync Filters chevron with sub‐group toggles

/**
 * Wire up sidebar UI:
 *  - Search‐bar styling
 *  - Sidebar toggle
 *  - Per‐group collapse/expand with animation
 *  - “Eye” bulk‐toggle icons
 *  - Filters “Toggle All” and master collapse/expand button
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

  // 2) Sidebar open/close
  sidebarToggle.textContent = "◀︎";
  sidebarToggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("hidden");
    sidebarToggle.style.left  = hidden ? "0px" : `${sidebar.offsetWidth}px`;
    sidebarToggle.textContent = hidden ? "▶︎" : "◀︎";
    map.invalidateSize();
  });

  // Helper: animate a group's toggle-group container
  function animateToggle(group) {
    const container = group.querySelector(".toggle-group");
    if (!container) return;
    const isCollapsed = group.classList.contains("collapsed");
    // prepare initial state
    container.style.transition = "none";
    container.style.maxHeight  = isCollapsed
      ? "0px"
      : `${container.scrollHeight}px`;
    // force reflow
    container.offsetHeight;
    // animate to target
    container.style.transition = "max-height 0.25s ease-in-out";
    if (isCollapsed) {
      group.classList.remove("collapsed");
      container.style.maxHeight = `${container.scrollHeight}px`;
    } else {
      group.classList.add("collapsed");
      container.style.maxHeight = "0px";
    }
  }

  // 3) Per–group collapse & eye‐toggle
  document.querySelectorAll(filterGroupSelector).forEach(group => {
    const header = group.querySelector("h3, h4");
    if (!header) return;

    // on header click: animate and update master icon
    header.addEventListener("click", () => {
      animateToggle(group);
      updateMasterCollapseIcon();
    });

    // inject eye icon for bulk‐toggle
    const eye = document.createElement("i");
    eye.classList.add("fas", "fa-eye", "filter-eye");
    eye.style.cursor     = "pointer";
    eye.style.marginLeft = "0.5em";
    header.appendChild(eye);

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

  // 4) Filters master controls
  const filtersHeader = document.querySelector('#filters-section > h2');
  if (filtersHeader) {
    // Toggle All link (checkboxes)
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

    // Collapse/Expand All button
    const collapseBtn = document.createElement('i');
    collapseBtn.classList.add('fas', 'collapse-all');
    collapseBtn.style.position   = 'absolute';
    collapseBtn.style.right      = '0.6em';
    collapseBtn.style.top        = '50%';
    collapseBtn.style.transform  = 'translateY(-50%)';
    collapseBtn.style.cursor     = 'pointer';
    collapseBtn.style.transition = 'color 0.2s';
    filtersHeader.appendChild(collapseBtn);

    const subGroups = () =>
      Array.from(document.querySelectorAll('#filters-section > .filter-group'));

    // update master icon based on all sub-group states
    function updateMasterCollapseIcon() {
      const allCollapsed = subGroups().every(g => g.classList.contains('collapsed'));
      collapseBtn.classList.toggle('fa-chevron-up', allCollapsed);
      collapseBtn.classList.toggle('fa-chevron-down', !allCollapsed);
    }

    collapseBtn.addEventListener('click', e => {
      e.stopPropagation();
      const groups      = subGroups();
      const allCollapsed = groups.every(g => g.classList.contains('collapsed'));
      // if all collapsed, expand all; else collapse all
      groups.forEach(g => {
        const shouldCollapse = !allCollapsed;
        if (g.classList.contains('collapsed') === shouldCollapse) return;
        animateToggle(g);
      });
      updateMasterCollapseIcon();
    });

    // initialize
    updateMasterCollapseIcon();
  }
}

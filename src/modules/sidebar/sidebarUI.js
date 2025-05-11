// @file: src/modules/sidebar/sidebarUI.js
// @version: 2.0 — use JS to fully hide collapsed content after animation

/**
 * Wire up sidebar UI:
 *  - Search‐bar styling
 *  - Sidebar toggle
 *  - Per‐group collapse/expand with animation + post-collapse hiding
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

  // 2) Sidebar open/close toggle
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
    const duration = 300; // match CSS transition duration (ms)

    // prepare
    container.style.transition = "none";
    if (isCollapsed) {
      // expanding: make sure visible, height=0
      container.style.display = "";
      container.style.maxHeight = "0px";
    }
    container.offsetHeight; // reflow

    // animate
    container.style.transition = `max-height ${duration}ms ease-in-out`;
    if (isCollapsed) {
      group.classList.remove("collapsed");
      container.style.maxHeight = `${container.scrollHeight}px`;
    } else {
      group.classList.add("collapsed");
      container.style.maxHeight = "0px";
    }

    // after animation, if collapsed fully, hide for good
    setTimeout(() => {
      if (group.classList.contains("collapsed")) {
        container.style.display = "none";
      }
      // clear inline max-height to allow auto height on next expand
      container.style.maxHeight = "";
    }, duration);
  }

  // Placeholder for master update
  let updateMasterCollapseIcon = () => {};

  // 3) Per-group collapse & eye‐toggle
  document.querySelectorAll(filterGroupSelector).forEach(group => {
    const header = group.querySelector("h3, h4");
    if (!header) return;

    // start hidden if collapsed in markup
    const container = group.querySelector(".toggle-group");
    if (group.classList.contains("collapsed") && container) {
      container.style.display = "none";
    }

    header.addEventListener("click", () => {
      animateToggle(group);
      updateMasterCollapseIcon();
    });

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
      updateMasterCollapseIcon();
    });
  });

  // 4) Filters master controls
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

    // Collapse/Expand All button
    const collapseBtn = document.createElement('i');
    collapseBtn.classList.add('fas', 'collapse-all', 'fa-chevron-right');
    collapseBtn.style.position   = 'absolute';
    collapseBtn.style.right      = '0.6em';
    collapseBtn.style.top        = '50%';
    collapseBtn.style.transform  = 'translateY(-50%)';
    collapseBtn.style.cursor     = 'pointer';
    collapseBtn.style.transition = 'color 0.2s';
    filtersHeader.appendChild(collapseBtn);

    const getSubGroups = () =>
      Array.from(document.querySelectorAll('#filters-section > .filter-group'));

    // Define update function
    updateMasterCollapseIcon = () => {
      const allCollapsed = getSubGroups().every(g => g.classList.contains('collapsed'));
      collapseBtn.classList.replace(
        allCollapsed ? 'fa-chevron-down' : 'fa-chevron-right',
        allCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'
      );
    };

    collapseBtn.addEventListener('click', e => {
      e.stopPropagation();
      const groups      = getSubGroups();
      const allCollapsed = groups.every(g => g.classList.contains('collapsed'));
      groups.forEach(g => {
        const shouldCollapse = !allCollapsed;
        if (g.classList.contains('collapsed') === shouldCollapse) return;
        animateToggle(g);
      });
      updateMasterCollapseIcon();
    });

    // init icon
    updateMasterCollapseIcon();
  }
}

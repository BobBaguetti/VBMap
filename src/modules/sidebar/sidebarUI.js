// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.6 — JS-driven smooth collapse/expand to eliminate lag

/**
 * Wire up basic sidebar UI interactions, including a JS-based
 * animateToggle for instant response on both collapse and expand.
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

  // Style the search bar
  searchBar.classList.add("ui-input");

  // Sidebar open/close toggle
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
    // Clear any inline styles so we read natural height
    container.style.transition = "none";
    container.style.maxHeight  = isCollapsed ? "0px" : `${container.scrollHeight}px`;
    // Force reflow
    container.offsetHeight;
    // Enable transition
    container.style.transition = "max-height 0.25s ease-in-out";
    if (isCollapsed) {
      // Expand
      container.style.maxHeight = `${container.scrollHeight}px`;
      group.classList.remove("collapsed");
    } else {
      // Collapse
      container.style.maxHeight = "0px";
      group.classList.add("collapsed");
    }
  }

  // Collapse & eye-toggle for every filter-group
  document.querySelectorAll(filterGroupSelector).forEach(group => {
    const header = group.querySelector("h3, h4");
    if (!header) return;

    // Collapse on header click using animateToggle
    header.addEventListener("click", () => {
      animateToggle(group);
      // update collapse-all icon if this is under Filters
      const filtersHeader = document.querySelector('#filters-section > h2 .collapse-all');
      if (filtersHeader) {
        filtersHeader.dispatchEvent(new Event("click", { bubbles: false }));
        // then restore its correct state
        filtersHeader.click();
      }
    });

    // Inject the eye icon (no change)
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

  // Toggle All & Collapse All for Filters
  const filtersHeader = document.querySelector('#filters-section > h2');
  if (filtersHeader) {
    // Toggle All (checkboxes)
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

    // Collapse All toggler
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

    const updateCollapseIcon = () => {
      const allCollapsed = subGroups().every(g => g.classList.contains('collapsed'));
      collapseBtn.classList.toggle('fa-chevron-up', allCollapsed);
      collapseBtn.classList.toggle('fa-chevron-down', !allCollapsed);
    };

    collapseBtn.addEventListener('click', e => {
      e.stopPropagation();
      const groups      = subGroups();
      const allCollapsed = groups.every(g => g.classList.contains('collapsed'));
      groups.forEach(g => animateToggle(g));
      updateCollapseIcon();
    });

    // initialize icon state
    updateCollapseIcon();
  }
}

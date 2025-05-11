// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.10 — hide content after collapse transition ends

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

  // Helper: animate a group's toggle-group container with post-transition hiding
  function animateToggle(group) {
    const container = group.querySelector(".toggle-group");
    if (!container) return;
    const isCollapsed = group.classList.contains("collapsed");

    // Clear previous listener to avoid duplicates
    container.removeEventListener("transitionend", onTransitionEnd);

    // Prepare initial state & show content if expanding
    if (isCollapsed) {
      container.style.visibility = "visible";
    }

    // Disable transition to set starting maxHeight
    container.style.transition = "none";
    container.style.maxHeight  = isCollapsed
      ? "0px"
      : `${container.scrollHeight}px`;

    // Force reflow
    container.offsetHeight;

    // Re-enable transition
    container.style.transition = "max-height 0.3s ease-in-out";

    // After collapse/expand, toggle the collapsed class
    if (isCollapsed) {
      group.classList.remove("collapsed");
      container.style.maxHeight = `${container.scrollHeight}px`;
    } else {
      group.classList.add("collapsed");
      container.style.maxHeight = "0px";
    }

    // After the height transition ends, hide for real if collapsed
    function onTransitionEnd(e) {
      if (e.propertyName === "max-height" && group.classList.contains("collapsed")) {
        container.style.visibility = "hidden";
      }
    }
    container.addEventListener("transitionend", onTransitionEnd);
  }

  // Placeholder for master update function
  let updateMasterCollapseIcon = () => {};

  // 1) Style the search bar
  searchBar.classList.add("ui-input");

  // 2) Sidebar toggle
  sidebarToggle.textContent = "◀︎";
  sidebarToggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("hidden");
    sidebarToggle.style.left  = hidden ? "0px" : `${sidebar.offsetWidth}px`;
    sidebarToggle.textContent = hidden ? "▶︎" : "◀︎";
    map.invalidateSize();
  });

  // 3) Per-group collapse & eye-toggle
  document.querySelectorAll(filterGroupSelector).forEach(group => {
    const header = group.querySelector("h3, h4");
    if (!header) return;

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
    // Toggle All
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

    // Now define master update
    updateMasterCollapseIcon = () => {
      const allCollapsed = getSubGroups().every(g => g.classList.contains('collapsed'));
      if (allCollapsed) {
        collapseBtn.classList.replace('fa-chevron-down', 'fa-chevron-right');
      } else {
        collapseBtn.classList.replace('fa-chevron-right', 'fa-chevron-down');
      }
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

    // initialize
    updateMasterCollapseIcon();
  }
}

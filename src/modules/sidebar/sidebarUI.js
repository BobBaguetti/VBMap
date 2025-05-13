// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.15 — master eye now drives all group eyes in lockstep

export function setupSidebarUI({
  map,
  sidebarSelector     = "#sidebar",
  toggleSelector      = "#sidebar-toggle",
  searchBarSelector   = "#search-bar",
  filterGroupSelector = ".filter-group"
}) {
  // Elements
  const sidebar       = document.querySelector(sidebarSelector);
  const sidebarToggle = document.querySelector(toggleSelector);
  const searchBar     = document.querySelector(searchBarSelector);
  const clearBtn      = document.getElementById("search-clear");

  if (!sidebar || !sidebarToggle || !searchBar || !clearBtn) {
    console.warn("[sidebarUI] Missing elements");
    return;
  }

  // 1) Search‐bar: add ui-input class & clear handler
  searchBar.classList.add("ui-input");
  clearBtn.addEventListener("click", () => {
    searchBar.value = "";
    searchBar.dispatchEvent(new Event("input", { bubbles: true }));
    searchBar.focus();
  });

  // 2) Sidebar toggle (mobile)
  sidebarToggle.addEventListener("click", () => sidebar.classList.toggle("open"));

  // 3) Main “Filters” section sticky behavior
  const filtersSection = document.querySelector("#filters-section");
  if (filtersSection) {
    const observer = new IntersectionObserver(
      ([e]) => filtersSection.classList.toggle("stuck", e.intersectionRatio < 1),
      { threshold: [1] }
    );
    observer.observe(filtersSection);
  }

  // 4) Collapsibles and Eye‐toggles

  // Placeholder for the collapse-all chevron updater
  let updateMasterCollapseIcon = () => {};
  // Placeholder for the master “eye” updater
  let updateMasterEyeIcon     = () => {};

  // 4a) Per-group collapse & eye-toggle
  document.querySelectorAll(filterGroupSelector).forEach(group => {
    const header = group.querySelector("h3, h4");
    if (!header) return;

    // collapse/expand
    header.addEventListener("click", () => {
      animateToggle(group);
      updateMasterCollapseIcon();
    });

    // eye-toggle for this group
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

      // update collapse chevron (unchanged)
      updateMasterCollapseIcon();
      // *** new: sync master eye ***
      updateMasterEyeIcon();
    });
  });

  // 4b) Master controls: inject eye + collapse chevron
  if (filtersSection) {
    const filtersHeader = filtersSection.querySelector("h2");

    // — Master eye (bulk toggle) —
    const masterEye = document.createElement("i");
    masterEye.classList.add("fas", "fa-eye", "filter-eye");
    masterEye.style.cursor     = "pointer";
    masterEye.style.marginLeft = "0.5em";
    filtersHeader.appendChild(masterEye);

    // Helper to update the master eye icon based on individual checkboxes
    updateMasterEyeIcon = () => {
      const cbs = Array.from(
        document.querySelectorAll('#filters-section .toggle-group input[type=checkbox]')
      );
      if (!cbs.length) return;
      const anyOff = cbs.some(cb => !cb.checked);
      masterEye.classList.toggle("fa-eye", anyOff);
      masterEye.classList.toggle("fa-eye-slash", !anyOff);
    };
    // Initialize master eye icon state
    updateMasterEyeIcon();

    masterEye.addEventListener("click", e => {
      e.stopPropagation();
      const cbs = Array.from(
        document.querySelectorAll('#filters-section .toggle-group input[type=checkbox]')
      );
      if (!cbs.length) return;

      // Determine new state (on if any are off)
      const newState = cbs.some(cb => !cb.checked);
      cbs.forEach(cb => {
        cb.checked = newState;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      });

      // Update the master eye icon
      masterEye.classList.toggle("fa-eye-slash", !newState);
      masterEye.classList.toggle("fa-eye", newState);

      // Sync every group's eye to match the master
      document.querySelectorAll(filterGroupSelector).forEach(group => {
        const groupEye = group.querySelector(".filter-eye");
        if (!groupEye) return;
        groupEye.classList.toggle("fa-eye-slash", !newState);
        groupEye.classList.toggle("fa-eye", newState);
      });
    });

    // — Collapse/Expand All chevron —
    const collapseBtn = document.createElement("i");
    collapseBtn.classList.add("fas", "collapse-all", "fa-chevron-right");
    collapseBtn.style.position   = "absolute";
    collapseBtn.style.right      = "0.6em";
    collapseBtn.style.top        = "50%";
    collapseBtn.style.transform  = "translateY(-50%)";
    collapseBtn.style.cursor     = "pointer";
    collapseBtn.style.transition = "color 0.2s";
    filtersHeader.appendChild(collapseBtn);

    const getSubGroups = () =>
      Array.from(filtersSection.querySelectorAll(filterGroupSelector));

    // Now that collapseBtn exists, wire up chevron updates
    updateMasterCollapseIcon = () => {
      const allCollapsed = getSubGroups().every(g => g.classList.contains("collapsed"));
      collapseBtn.classList.replace(
        allCollapsed ? "fa-chevron-down" : "fa-chevron-right",
        allCollapsed ? "fa-chevron-right" : "fa-chevron-down"
      );
    };

    collapseBtn.addEventListener("click", e => {
      e.stopPropagation();
      const groups       = getSubGroups();
      const allCollapsed = groups.every(g => g.classList.contains("collapsed"));
      groups.forEach(g => {
        const shouldCollapse = !allCollapsed;
        if (g.classList.contains("collapsed") === shouldCollapse) return;
        animateToggle(g);
      });
      updateMasterCollapseIcon();
    });

    // Initialize collapse chevron
    updateMasterCollapseIcon();
  }
}

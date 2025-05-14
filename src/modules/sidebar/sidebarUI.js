// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.24 — hide content 50 ms before collapse animation ends

export function setupSidebarUI({
  map,
  sidebarSelector     = "#sidebar",
  toggleSelector      = "#sidebar-toggle",
  searchBarSelector   = "#search-bar",
  filterGroupSelector = ".filter-group"
}) {
  const COLLAPSE_DURATION = 300; // total collapse animation time (ms)
  const PREHIDE_OFFSET    = 75;  // hide content this many ms before the end

  // helper to animate collapse/expand
  function animateToggle(group) {
    const container   = group.querySelector(".toggle-group");
    const isCollapsed = group.classList.contains("collapsed");

    // reset any previous inline visibility
    container.style.transition = "none";
    container.style.maxHeight  = isCollapsed
      ? "0px"
      : `${container.scrollHeight}px`;
    container.offsetHeight;
    container.style.transition = `max-height ${COLLAPSE_DURATION}ms ease-in-out`;

    if (isCollapsed) {
      // EXPAND: show then slide down
      container.style.visibility = "visible";
      group.classList.remove("collapsed");
      container.style.maxHeight = `${container.scrollHeight}px`;
    } else {
      // COLLAPSE: slide up, then hide content slightly early
      container.style.removeProperty("visibility");
      group.classList.add("collapsed");
      container.style.maxHeight = "0px";

      // schedule hide just before animation ends
      setTimeout(() => {
        container.style.visibility = "hidden";
      }, COLLAPSE_DURATION - PREHIDE_OFFSET);
    }
  }

  // sync chevrons
  function syncGroupChevrons() {
    document.querySelectorAll(filterGroupSelector).forEach(group => {
      const chevron = group.querySelector(".group-toggle");
      if (!chevron) return;
      const down = !group.classList.contains("collapsed");
      chevron.classList.toggle("fa-chevron-down", down);
      chevron.classList.toggle("fa-chevron-right", !down);
    });
  }

  // core elements
  const sidebar       = document.querySelector(sidebarSelector);
  const sidebarToggle = document.querySelector(toggleSelector);
  const searchBar     = document.querySelector(searchBarSelector);
  const clearBtn      = document.getElementById("search-clear");
  if (!sidebar || !sidebarToggle || !searchBar || !clearBtn) {
    console.warn("[sidebarUI] Missing elements");
    return;
  }

  // 1) Search bar
  searchBar.classList.add("ui-input");
  clearBtn.addEventListener("click", () => {
    searchBar.value = "";
    searchBar.dispatchEvent(new Event("input", { bubbles: true }));
    searchBar.focus();
  });

  // 2) Mobile toggle
  sidebarToggle.addEventListener("click", () => sidebar.classList.toggle("open"));

  // 3) Sticky Filters header
  const filtersSection = document.querySelector("#filters-section");
  if (filtersSection) {
    const obs = new IntersectionObserver(
      ([e]) => filtersSection.classList.toggle("stuck", e.intersectionRatio < 1),
      { threshold: [1] }
    );
    obs.observe(filtersSection);
  }

  // placeholders for master update fns
  let updateMasterCollapseIcon = () => {};
  let updateMasterEyeIcon     = () => {};

  // 4a) Per-group collapse chevron & eye-toggle
  document.querySelectorAll(filterGroupSelector).forEach(group => {
    const header = group.querySelector("h3, h4");
    if (!header) return;

    // collapse chevron
    const toggleIcon = document.createElement("i");
    toggleIcon.classList.add(
      "fas",
      group.classList.contains("collapsed") ? "fa-chevron-right" : "fa-chevron-down",
      "group-toggle"
    );
    toggleIcon.style.cursor     = "pointer";
    toggleIcon.style.marginLeft = "0.5em";
    header.appendChild(toggleIcon);

    // eye-toggle
    const eye = document.createElement("i");
    eye.classList.add("fas", "fa-eye", "filter-eye");
    eye.style.cursor     = "pointer";
    eye.style.marginLeft = "0.5em";
    header.appendChild(eye);

    // header click toggles collapse + chevron
    header.addEventListener("click", () => {
      animateToggle(group);
      updateMasterCollapseIcon();
      toggleIcon.classList.toggle("fa-chevron-right");
      toggleIcon.classList.toggle("fa-chevron-down");
    });

    // direct chevron click
    toggleIcon.addEventListener("click", e => {
      e.stopPropagation();
      animateToggle(group);
      updateMasterCollapseIcon();
      toggleIcon.classList.toggle("fa-chevron-right");
      toggleIcon.classList.toggle("fa-chevron-down");
    });

    // eye-toggle click
    eye.addEventListener("click", e => {
      e.stopPropagation();
      const inputs = group.querySelectorAll("input[type=checkbox]");
      const anyOff = Array.from(inputs).some(cb => !cb.checked);
      inputs.forEach(cb => {
        cb.checked = anyOff;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      });
      group.classList.toggle("disabled", !anyOff);
      eye.classList.toggle("fa-eye-slash", !anyOff);
      eye.classList.toggle("fa-eye",       anyOff);
      updateMasterCollapseIcon();
      updateMasterEyeIcon();
    });
  });

  // 4b) Master controls
  if (filtersSection) {
    const header = filtersSection.querySelector("h2");

    // master eye
    const masterEye = document.createElement("i");
    masterEye.classList.add("fas", "fa-eye", "filter-eye");
    masterEye.style.cursor     = "pointer";
    masterEye.style.marginLeft = "0.5em";
    header.appendChild(masterEye);

    updateMasterEyeIcon = () => {
      const cbs = Array.from(
        document.querySelectorAll('#filters-section .toggle-group input[type=checkbox]')
      );
      if (!cbs.length) return;
      const anyChecked = cbs.some(cb => cb.checked);
      masterEye.classList.toggle("fa-eye",       anyChecked);
      masterEye.classList.toggle("fa-eye-slash", !anyChecked);
    };
    updateMasterEyeIcon();

    masterEye.addEventListener("click", e => {
      e.stopPropagation();
      const cbs      = Array.from(
        document.querySelectorAll('#filters-section .toggle-group input[type=checkbox]')
      );
      if (!cbs.length) return;
      const newState = cbs.some(cb => !cb.checked);
      cbs.forEach(cb => {
        cb.checked = newState;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      });
      document.querySelectorAll(filterGroupSelector).forEach(group => {
        group.classList.toggle("disabled", !newState);
      });
      updateMasterEyeIcon();
      document.querySelectorAll(filterGroupSelector).forEach(group => {
        const ge = group.querySelector(".filter-eye");
        if (!ge) return;
        ge.classList.toggle("fa-eye",       newState);
        ge.classList.toggle("fa-eye-slash", !newState);
      });
    });

    // master collapse/expand
    const collapseBtn = document.createElement("i");
    collapseBtn.classList.add("fas", "collapse-all", "fa-chevron-right");
    Object.assign(collapseBtn.style, {
      position:   "absolute",
      right:      "0.6em",
      top:        "50%",
      transform:  "translateY(-50%)",
      cursor:     "pointer",
      transition: "color 0.2s"
    });
    header.appendChild(collapseBtn);

    const getSubGroups = () =>
      Array.from(filtersSection.querySelectorAll(filterGroupSelector));

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
      syncGroupChevrons();
    });

    updateMasterCollapseIcon();
  }
}

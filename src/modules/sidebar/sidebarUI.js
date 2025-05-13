// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.18 — add disabled class to filter-groups when their eye-toggle is off

export function setupSidebarUI({
  map,
  sidebarSelector     = "#sidebar",
  toggleSelector      = "#sidebar-toggle",
  searchBarSelector   = "#search-bar",
  filterGroupSelector = ".filter-group"
}) {
  // helper to animate collapse/expand
  function animateToggle(group) {
    const container = group.querySelector(".toggle-group");
    const isCollapsed = group.classList.contains("collapsed");
    if (isCollapsed) container.style.visibility = "visible";

    container.style.transition = "none";
    container.style.maxHeight  = isCollapsed
      ? "0px"
      : `${container.scrollHeight}px`;
    container.offsetHeight;
    container.style.transition = "max-height 0.3s ease-in-out";

    if (isCollapsed) {
      group.classList.remove("collapsed");
      container.style.maxHeight = `${container.scrollHeight}px`;
    } else {
      group.classList.add("collapsed");
      container.style.maxHeight = "0px";
    }

    function onEnd(e) {
      if (e.propertyName === "max-height" && group.classList.contains("collapsed")) {
        container.style.visibility = "hidden";
      }
      container.removeEventListener("transitionend", onEnd);
    }
    container.addEventListener("transitionend", onEnd);
  }

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

  // placeholders for updater functions
  let updateMasterCollapseIcon = () => {};
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

      // add/remove disabled class on the group
      group.classList.toggle("disabled", !anyOff);

      // update eye icon
      eye.classList.toggle("fa-eye-slash", !anyOff);
      eye.classList.toggle("fa-eye", anyOff);

      updateMasterCollapseIcon();
      updateMasterEyeIcon();
    });
  });

  // 4b) Master controls
  if (filtersSection) {
    const filtersHeader = filtersSection.querySelector("h2");

    // Master eye
    const masterEye = document.createElement("i");
    masterEye.classList.add("fas", "fa-eye", "filter-eye");
    masterEye.style.cursor     = "pointer";
    masterEye.style.marginLeft = "0.5em";
    filtersHeader.appendChild(masterEye);

    updateMasterEyeIcon = () => {
      const cbs = Array.from(
        document.querySelectorAll('#filters-section .toggle-group input[type=checkbox]')
      );
      if (!cbs.length) return;
      // eye open when ANY filter is ON
      const anyChecked = cbs.some(cb => cb.checked);
      masterEye.classList.toggle("fa-eye",       anyChecked);
      masterEye.classList.toggle("fa-eye-slash", !anyChecked);
    };
    updateMasterEyeIcon();

    masterEye.addEventListener("click", e => {
      e.stopPropagation();
      const cbs = Array.from(
        document.querySelectorAll('#filters-section .toggle-group input[type=checkbox]')
      );
      if (!cbs.length) return;

      const newState = cbs.some(cb => !cb.checked);
      cbs.forEach(cb => {
        cb.checked = newState;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      });

      // sync disabled class on each group
      document.querySelectorAll(filterGroupSelector).forEach(group => {
        group.classList.toggle("disabled", !newState);
      });

      // sync master eye
      updateMasterEyeIcon();

      // sync group eyes
      document.querySelectorAll(filterGroupSelector).forEach(group => {
        const groupEye = group.querySelector(".filter-eye");
        if (!groupEye) return;
        groupEye.classList.toggle("fa-eye",       newState);
        groupEye.classList.toggle("fa-eye-slash", !newState);
      });
    });

    // Collapse/Expand chevron
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
    filtersHeader.appendChild(collapseBtn);

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
    });

    updateMasterCollapseIcon();
  }
}

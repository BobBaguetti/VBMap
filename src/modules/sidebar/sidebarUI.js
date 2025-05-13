// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.12 — removed legacy “Toggle All” link logic

/**
 * Wire up sidebar UI:
 *  - Search‐bar styling & clear button
 *  - Sidebar toggle
 *  - Per‐group collapse/expand with animation
 *  - “Eye” bulk‐toggle icons
 *  - Master collapse/expand button
 */
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
    searchBar.dispatchEvent(new Event("input"));
    searchBar.focus();
  });

  // 2) Sidebar open/close
  sidebarToggle.textContent = "◀︎";
  sidebarToggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("hidden");
    sidebarToggle.style.left  = hidden ? "0px" : `${sidebar.offsetWidth}px`;
    sidebarToggle.textContent = hidden ? "▶︎" : "◀︎";
    map.invalidateSize();
  });

  // Helper: animate a group's toggle-group container with post-transition hiding
  function animateToggle(group) {
    const container = group.querySelector(".toggle-group");
    if (!container) return;
    const isCollapsed = group.classList.contains("collapsed");

    container.removeEventListener("transitionend", onTransitionEnd);

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

    function onTransitionEnd(e) {
      if (e.propertyName === "max-height" && group.classList.contains("collapsed")) {
        container.style.visibility = "hidden";
      }
    }
    container.addEventListener("transitionend", onTransitionEnd);
  }

  // Placeholder for master collapse-icon updater
  let updateMasterCollapseIcon = () => {};

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

  // 4) Master collapse/expand button only
  const filtersSection = document.querySelector("#filters-section");
  if (filtersSection) {
    const filtersHeader = filtersSection.querySelector("h2");
    // Collapse/Expand All button
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

// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.6.2 — hide content container completely when collapsed

/**
 * Wire up sidebar UI interactions with smooth height animations:
 *  - Search‐bar styling
 *  - Sidebar toggle (show/hide)
 *  - Collapsible filter groups with JS‐animated height + display toggling
 *  - “Eye” icons on each group header
 *  - Toggle All & Collapse All for Filters section
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

  if (!sidebar || !sidebarToggle || !searchBar) return;

  // 1) Style the search bar
  searchBar.classList.add("ui-input");

  // 2) Sidebar show/hide
  sidebarToggle.textContent = "◀︎";
  sidebarToggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("hidden");
    sidebarToggle.style.left  = hidden ? "0px" : `${sidebar.offsetWidth}px`;
    sidebarToggle.textContent = hidden ? "▶︎" : "◀︎";
    map.invalidateSize();
  });

  // Helper: animate a group's toggle-group height and then toggle display
  function animateGroup(group, expand) {
    const content = group.querySelector(".toggle-group");
    if (!content) return;
    const fullHeight = content.scrollHeight;

    content.style.transition = "height 0.25s ease";
    content.style.overflow = "hidden";
    if (expand) {
      // make visible and animate from 0 → fullHeight
      content.style.display = "";
      content.style.height = "0px";
      requestAnimationFrame(() => {
        content.style.height = fullHeight + "px";
      });
      content.addEventListener("transitionend", function onExpand() {
        content.style.height = "";
        content.style.transition = "";
        content.removeEventListener("transitionend", onExpand);
      });
    } else {
      // animate from current to 0, then hide
      content.style.height = fullHeight + "px";
      requestAnimationFrame(() => {
        content.style.height = "0px";
      });
      content.addEventListener("transitionend", function onCollapse() {
        content.style.display = "none";
        content.style.transition = "";
        content.removeEventListener("transitionend", onCollapse);
      });
    }
  }

  // 3) Set up each filter-group header for JS collapse
  document.querySelectorAll(filterGroupSelector).forEach(group => {
    const header = group.querySelector("h3, h4");
    const content = group.querySelector(".toggle-group");
    if (!header || !content) return;

    // ensure open on init
    group.classList.remove("collapsed");
    content.style.display = "";
    content.style.height = "";

    header.addEventListener("click", () => {
      const nowCollapsed = group.classList.toggle("collapsed");
      animateGroup(group, !nowCollapsed);
    });

    // Eye toggle
    const eye = document.createElement("i");
    eye.classList.add("fas", "fa-eye", "filter-eye");
    eye.style.cursor     = "pointer";
    eye.style.marginLeft = "0.5em";
    header.appendChild(eye);
    eye.addEventListener("click", e => {
      e.stopPropagation();
      const cbs = Array.from(group.querySelectorAll("input[type=checkbox]"));
      const anyOff = cbs.some(cb => !cb.checked);
      cbs.forEach(cb => {
        cb.checked = anyOff;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      });
      eye.classList.toggle("fa-eye-slash", !anyOff);
      eye.classList.toggle("fa-eye", anyOff);
    });
  });

  // 4) Toggle All & Collapse All for Filters section
  const filtersHeader = document.querySelector("#filters-section > h2");
  if (filtersHeader) {
    // Toggle All
    const toggleAllLink = document.createElement("a");
    toggleAllLink.textContent = "Toggle All";
    toggleAllLink.classList.add("toggle-all");
    toggleAllLink.style.marginLeft = "1em";
    toggleAllLink.style.cursor     = "pointer";
    filtersHeader.appendChild(toggleAllLink);
    toggleAllLink.addEventListener("click", e => {
      e.stopPropagation();
      const cbs = Array.from(
        document.querySelectorAll("#filters-section .toggle-group input[type=checkbox]")
      );
      const anyOff = cbs.some(cb => !cb.checked);
      cbs.forEach(cb => {
        cb.checked = anyOff;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });

    // Collapse/Expand All
    const collapseBtn = document.createElement("i");
    collapseBtn.classList.add("fas", "collapse-all");
    collapseBtn.style.marginLeft = "0.5em";
    collapseBtn.style.cursor     = "pointer";
    filtersHeader.appendChild(collapseBtn);

    const subGroups = () =>
      Array.from(document.querySelectorAll("#filters-section > .filter-group"));

    const updateCollapseIcon = () => {
      const allCollapsed = subGroups().every(g => g.classList.contains("collapsed"));
      collapseBtn.classList.toggle("fa-chevron-up", allCollapsed);
      collapseBtn.classList.toggle("fa-chevron-down", !allCollapsed);
    };

    collapseBtn.addEventListener("click", e => {
      e.stopPropagation();
      const groups = subGroups();
      const allCollapsed = groups.every(g => g.classList.contains("collapsed"));
      groups.forEach(g => {
        g.classList.toggle("collapsed", !allCollapsed);
        animateGroup(g, allCollapsed);
      });
      updateCollapseIcon();
    });

    updateCollapseIcon();
  }
}

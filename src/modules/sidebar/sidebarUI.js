// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.8 — auto‐wrap toggle‐group contents in toggle‐inner

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

  // —————————————  
  // NEW: wrap each .toggle-group’s children into a .toggle-inner
  document.querySelectorAll(".toggle-group").forEach(group => {
    // If we’ve already wrapped, skip
    if (group.querySelector(":scope > .toggle-inner")) return;

    const inner = document.createElement("div");
    inner.className = "toggle-inner";
    // move all existing children into inner
    while (group.firstChild) {
      inner.appendChild(group.firstChild);
    }
    group.appendChild(inner);
  });
  // —————————————  

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

  // 3) Collapse & eye‐toggle for every filter‐group (CSS handles animation)
  document.querySelectorAll(filterGroupSelector).forEach(group => {
    const header = group.querySelector("h3, h4");
    if (!header) return;

    // Collapse on header click
    header.addEventListener("click", () => {
      group.classList.toggle("collapsed");
    });

    // Inject the eye icon
    const eye = document.createElement("i");
    eye.classList.add("fas", "fa-eye", "filter-eye");
    eye.style.cursor     = "pointer";
    eye.style.marginLeft = "0.5em";
    header.appendChild(eye);

    // Toggle all child checkboxes
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

  // 4) Toggle All & Collapse All for Filters section
  const filtersHeader = document.querySelector("#filters-section > h2");
  if (filtersHeader) {
    // Toggle All link
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
      if (!cbs.length) return;
      const anyOff = cbs.some(cb => !cb.checked);
      cbs.forEach(cb => {
        cb.checked = anyOff;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });

    // Collapse/Expand All chevron
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
      });
      updateCollapseIcon();
    });

    updateCollapseIcon();
  }
}

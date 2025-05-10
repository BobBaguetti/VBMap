// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.0 — sidebar open/close, search-bar styling, group collapse

/**
 * Wire up basic sidebar UI interactions:
 *  - Search‐bar styling
 *  - Sidebar toggle (show/hide)
 *  - Collapsible filter groups
 *
 * @param {{
 *   map: L.Map,
 *   sidebarSelector: string,
 *   toggleSelector: string,
 *   searchBarSelector: string,
 *   filterGroupSelector: string
 * }} opts
 */
export function setupSidebarUI({
  map,
  sidebarSelector        = "#sidebar",
  toggleSelector         = "#sidebar-toggle",
  searchBarSelector      = "#search-bar",
  filterGroupSelector    = ".filter-group"
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

  // 2) Toggle sidebar open/closed
  sidebarToggle.textContent = "◀︎";
  sidebarToggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("hidden");
    sidebarToggle.style.left  = hidden ? "0px" : "350px";
    sidebarToggle.textContent = hidden ? "▶︎" : "◀︎";
    map.invalidateSize();
  });

  // 3) Allow filter-group headers to collapse their sections
  document.querySelectorAll(filterGroupSelector).forEach(group => {
    const header = group.querySelector("h3");
    header?.addEventListener("click", () => {
      group.classList.toggle("collapsed");
      console.log(`[sidebarUI] toggled ${group.id || header.textContent}`);
    });
  });
}

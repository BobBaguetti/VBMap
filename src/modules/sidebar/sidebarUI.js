// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.1 — add eye‐toggle icons & nested collapse support

/**
 * Wire up basic sidebar UI interactions:
 *  - Search‐bar styling
 *  - Sidebar toggle (show/hide)
 *  - Collapsible filter groups (h3/h4 headers)
 *  - “Eye” icons on each group header to toggle visibility of that entire group
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

  // 2) Toggle sidebar open/closed
  sidebarToggle.textContent = "◀︎";
  sidebarToggle.addEventListener("click", () => {
    const hidden = sidebar.classList.toggle("hidden");
    sidebarToggle.style.left  = hidden ? "0px" : "350px";
    sidebarToggle.textContent = hidden ? "▶︎" : "◀︎";
    map.invalidateSize();
  });

  // 3) Collapse & eye‐toggle for every filter‐group
  document.querySelectorAll(filterGroupSelector).forEach(group => {
    // Find the header (either h3 or h4)
    const header = group.querySelector("h3, h4");
    if (!header) return;

    // 3a) Collapse on header click
    header.addEventListener("click", () => {
      group.classList.toggle("collapsed");
      console.log(`[sidebarUI] toggled ${group.id || header.textContent}`);
    });

    // 3b) Inject the eye icon
    const eye = document.createElement("i");
    eye.classList.add("fas", "fa-eye", "filter-eye");
    eye.style.cursor      = "pointer";
    eye.style.marginLeft  = "0.5em";
    header.appendChild(eye);

    // 3c) Toggle all checkboxes in this group on/off
    eye.addEventListener("click", e => {
      e.stopPropagation(); // don’t trigger collapse
      const inputs   = group.querySelectorAll("input[type=checkbox]");
      const visible  = eye.classList.contains("fa-eye");

      if (visible) {
        // switch to “hidden” state
        eye.classList.replace("fa-eye", "fa-eye-slash");
        inputs.forEach(cb => {
          cb.checked = false;
          cb.dispatchEvent(new Event("change", { bubbles: true }));
        });
      } else {
        // switch back to “visible”
        eye.classList.replace("fa-eye-slash", "fa-eye");
        inputs.forEach(cb => {
          cb.checked = true;
          cb.dispatchEvent(new Event("change", { bubbles: true }));
        });
      }
    });
  });
}

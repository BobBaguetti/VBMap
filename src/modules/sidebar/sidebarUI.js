// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.2 — add explicit Show All / Hide All links

/**
 * Wire up basic sidebar UI interactions:
 *  - Search‐bar styling
 *  - Sidebar toggle (show/hide)
 *  - Collapsible filter groups (h3/h4 headers)
 *  - “Eye” icons on each group header
 *  - **New**: Show All / Hide All bulk‐toggle links
 *
 * @param {{ map: L.Map, sidebarSelector: string, toggleSelector: string, searchBarSelector: string, filterGroupSelector: string }} opts
 */
export function setupSidebarUI({
  map,
  sidebarSelector     = "#sidebar",
  toggleSelector      = "#sidebar-toggle",
  searchBarSelector   = "#search-bar",
  filterGroupSelector = ".filter-group"
}) {
  // … (unchanged sidebar toggle & search styling) …

  document.querySelectorAll(filterGroupSelector).forEach(group => {
    const header = group.querySelector("h3, h4");
    if (!header) return;

    // --- Collapse on header click ---
    header.addEventListener("click", () => {
      group.classList.toggle("collapsed");
    });

    // --- Existing eye icon (kept) ---
    const eye = document.createElement("i");
    eye.classList.add("fas","fa-eye","filter-eye");
    eye.style.cursor = "pointer";
    header.appendChild(eye);
    eye.addEventListener("click", e => {
      e.stopPropagation();
      const inputs = group.querySelectorAll("input[type=checkbox]");
      const anyOff = [...inputs].some(cb => !cb.checked);
      inputs.forEach(cb => {
        cb.checked = anyOff;
        cb.dispatchEvent(new Event("change",{bubbles:true}));
      });
      eye.classList.toggle("fa-eye-slash", !anyOff);
      eye.classList.toggle("fa-eye", anyOff);
    });

    // --- NEW: Show All / Hide All links ---
    const container = document.createElement("span");
    container.classList.add("header-actions");

    const showAll = document.createElement("a");
    showAll.textContent = "Show All";
    showAll.href = "#";
    showAll.classList.add("show-all");
    showAll.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation();
      group.querySelectorAll("input[type=checkbox]").forEach(cb => {
        if (!cb.checked) {
          cb.checked = true;
          cb.dispatchEvent(new Event("change",{bubbles:true}));
        }
      });
      updateLinks();
    });

    const hideAll = document.createElement("a");
    hideAll.textContent = "Hide All";
    hideAll.href = "#";
    hideAll.classList.add("hide-all");
    hideAll.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation();
      group.querySelectorAll("input[type=checkbox]").forEach(cb => {
        if (cb.checked) {
          cb.checked = false;
          cb.dispatchEvent(new Event("change",{bubbles:true}));
        }
      });
      updateLinks();
    });

    container.append(showAll, hideAll);
    header.appendChild(container);

    // Show/hide the appropriate link based on current state
    function updateLinks() {
      const inputs = Array.from(group.querySelectorAll("input[type=checkbox]"));
      const allOn = inputs.every(cb => cb.checked);
      showAll.style.display = allOn ? "none" : "inline";
      hideAll.style.display = allOn ? "inline" : "none";
    }

    // initialize and keep in sync
    updateLinks();
    group.querySelectorAll("input[type=checkbox]")
         .forEach(cb => cb.addEventListener("change", updateLinks));
  });
}

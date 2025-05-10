// @file: src/modules/sidebar/sidebarCore.js
// @version: 1.1 — more flexible search-bar lookup

/**
 * Initialize core sidebar DOM elements and wire the sidebar toggle.
 *
 * @param {L.Map} map — the Leaflet map instance (to handle map resizing)
 * @returns {{
 *   sidebar: HTMLElement,
 *   searchBar: HTMLInputElement,
 *   settingsSection: HTMLElement,
 *   filterSection: HTMLElement
 * }}
 */
export function initCore(map) {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) throw new Error("Sidebar element (#sidebar) not found in DOM");

  // Attempt to find the search input
  let searchBar = sidebar.querySelector("#sidebar-search");
  if (!searchBar) {
    // fallback to the first input in the sidebar
    searchBar = sidebar.querySelector("input");
    console.warn(
      "initCore: #sidebar-search not found, falling back to first <input> in sidebar"
    );
  }
  if (!searchBar) {
    throw new Error("Search input not found in sidebar");
  }

  // Sidebar toggle button
  const toggleBtn = document.getElementById("sidebar-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      setTimeout(() => map.invalidateSize(), 300);
    });
  }

  const settingsSection = sidebar.querySelector("#sidebar-settings");
  if (!settingsSection) throw new Error("Settings section (#sidebar-settings) not found");

  const filterSection = sidebar.querySelector("#sidebar-filters");
  if (!filterSection) throw new Error("Filter section (#sidebar-filters) not found");

  return { sidebar, searchBar, settingsSection, filterSection };
}

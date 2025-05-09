// @file: src/modules/sidebar/sidebarCore.js
// @version: 1.0 — core sidebar element querying & collapse toggle

/**
 * Initialize core sidebar DOM elements and wire the sidebar toggle.
 *
 * @param {L.Map} map — the Leaflet map instance (to handle any map resizing)
 * @returns {{
 *   sidebar: HTMLElement,
 *   searchBar: HTMLInputElement,
 *   settingsSection: HTMLElement,
 *   filterSection: HTMLElement
 * }}
 */
export function initCore(map) {
  // Root sidebar container
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) {
    throw new Error("Sidebar element (#sidebar) not found in DOM");
  }

  // Search input at the top of the sidebar
  const searchBar = sidebar.querySelector("#sidebar-search");
  if (!searchBar) {
    throw new Error("Search input (#sidebar-search) not found in sidebar");
  }

  // Toggle button to collapse/expand the sidebar
  const toggleBtn = document.getElementById("sidebar-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      // Ensure map invalidates size after transition
      setTimeout(() => map.invalidateSize(), 300);
    });
  }

  // Section for Settings (e.g. grouping, clustering)
  const settingsSection = sidebar.querySelector("#sidebar-settings");
  if (!settingsSection) {
    throw new Error("Settings section (#sidebar-settings) not found");
  }

  // Section for Filters (items, chests, etc.)
  const filterSection = sidebar.querySelector("#sidebar-filters");
  if (!filterSection) {
    throw new Error("Filter section (#sidebar-filters) not found");
  }

  return { sidebar, searchBar, settingsSection, filterSection };
}

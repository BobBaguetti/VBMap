// @file: src/modules/sidebar/sidebarCore.js
// @version: 1.2 — tolerate missing sections by falling back to empty containers

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

  // Search input
  let searchBar = sidebar.querySelector("#sidebar-search");
  if (!searchBar) {
    searchBar = sidebar.querySelector("input");
    console.warn(
      "initCore: #sidebar-search not found, falling back to first <input> in sidebar"
    );
  }
  if (!searchBar) {
    // create a dummy hidden input so filters won't crash
    console.warn("initCore: no <input> found in sidebar; creating dummy searchBar");
    searchBar = document.createElement("input");
    searchBar.style.display = "none";
    sidebar.prepend(searchBar);
  }

  // Toggle button
  const toggleBtn = document.getElementById("sidebar-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      setTimeout(() => map.invalidateSize(), 300);
    });
  }

  // Settings section
  let settingsSection = sidebar.querySelector("#sidebar-settings");
  if (!settingsSection) {
    console.warn("initCore: #sidebar-settings not found; creating placeholder");
    settingsSection = document.createElement("div");
    settingsSection.id = "sidebar-settings";
    sidebar.append(settingsSection);
  }

  // Filter section
  let filterSection = sidebar.querySelector("#sidebar-filters");
  if (!filterSection) {
    console.warn("initCore: #sidebar-filters not found; creating placeholder");
    filterSection = document.createElement("div");
    filterSection.id = "sidebar-filters";
    sidebar.append(filterSection);
  }

  return { sidebar, searchBar, settingsSection, filterSection };
}

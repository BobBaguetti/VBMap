// @file: src/modules/sidebar/mobileToggle.js
// @version: 1.0 — extracted mobile sidebar open/close toggle

/**
 * Sets up the mobile sidebar open/close toggle button.
 *
 * @param {object} params
 * @param {string} params.sidebarSelector – selector for the sidebar container
 * @param {string} params.toggleSelector  – selector for the toggle button
 */
export function setupSidebarMobileToggle({
  sidebarSelector = "#sidebar",
  toggleSelector  = "#sidebar-toggle"
}) {
  const sidebar       = document.querySelector(sidebarSelector);
  const sidebarToggle = document.querySelector(toggleSelector);
  if (!sidebar || !sidebarToggle) {
    console.warn("[sidebarMobileToggle] Missing elements");
    return;
  }

  sidebarToggle.addEventListener("click", () =>
    sidebar.classList.toggle("open")
  );
}

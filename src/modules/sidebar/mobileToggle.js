// @file: src/modules/sidebar/mobileToggle.js
// @version: 1.2 — toggle `.hidden` on sidebar and `.collapsed` on button

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

  // Ensure initial state
  sidebar.classList.remove("hidden");
  sidebarToggle.classList.remove("collapsed");

  sidebarToggle.addEventListener("click", () => {
    const isHidden = sidebar.classList.toggle("hidden");
    sidebarToggle.classList.toggle("collapsed", isHidden);
  });
}

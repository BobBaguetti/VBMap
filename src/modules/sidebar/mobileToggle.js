// @file: src/modules/sidebar/mobileToggle.js
// @version: 1.3 — swap chevron icon classes instead of rotating button

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

  // Ensure initial state: sidebar shown, icon pointing left
  sidebar.classList.remove("hidden");
  const icon = sidebarToggle.querySelector("i");
  if (icon) {
    icon.classList.remove("fa-chevron-right");
    icon.classList.add("fa-chevron-left");
  }

  sidebarToggle.addEventListener("click", () => {
    const isHidden = sidebar.classList.toggle("hidden");
    if (icon) {
      // swap between left and right chevrons
      icon.classList.toggle("fa-chevron-left", !isHidden);
      icon.classList.toggle("fa-chevron-right", isHidden);
    }
  });
}

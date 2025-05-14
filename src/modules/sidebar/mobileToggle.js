// @file: src/modules/sidebar/mobileToggle.js
// @version: 1.1 — inject Font Awesome chevron toggle button & switch icons on open/close

/**
 * Sets up the mobile sidebar open/close toggle button,
 * injecting the button into the DOM and swapping
 * Font Awesome chevrons on toggle.
 *
 * @param {object} params
 * @param {string} params.sidebarSelector – selector for the sidebar container
 */
export function setupSidebarMobileToggle({
  sidebarSelector = "#sidebar"
}) {
  const sidebar = document.querySelector(sidebarSelector);
  if (!sidebar) {
    console.warn("[sidebarMobileToggle] Sidebar element not found:", sidebarSelector);
    return;
  }

  // Create toggle button
  const toggleButton = document.createElement("button");
  toggleButton.id = "sidebar-toggle";
  toggleButton.setAttribute("aria-label", "Toggle sidebar");
  toggleButton.classList.add("sidebar-toggle");
  // start closed: show "chevron-right"
  toggleButton.innerHTML = `<i class="fas fa-chevron-right" aria-hidden="true"></i>`;
  
  // Insert button before sidebar in the DOM
  sidebar.parentNode.insertBefore(toggleButton, sidebar);

  // Click handler: toggle .open and swap icon
  toggleButton.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");
    const icon = toggleButton.querySelector("i");
    if (isOpen) {
      // now open → show left chevron
      icon.classList.replace("fa-chevron-right", "fa-chevron-left");
    } else {
      // now closed → show right chevron
      icon.classList.replace("fa-chevron-left", "fa-chevron-right");
    }
  });
}

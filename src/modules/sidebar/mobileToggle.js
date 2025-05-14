// @file: src/modules/sidebar/mobileToggle.js
// @version: 1.2 — toggle `.hidden` to match CSS and invert icon logic

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
  // start visible: show "chevron-left" (sidebar open → can collapse)
  toggleButton.innerHTML = `<i class="fas fa-chevron-left" aria-hidden="true"></i>`;
  
  // Insert button before sidebar in the DOM
  sidebar.parentNode.insertBefore(toggleButton, sidebar);

  // Click handler: toggle .hidden and swap icon
  toggleButton.addEventListener("click", () => {
    const isHidden = sidebar.classList.toggle("hidden");
    const icon = toggleButton.querySelector("i");
    if (isHidden) {
      // sidebar is now hidden → show right chevron to open
      icon.classList.replace("fa-chevron-left", "fa-chevron-right");
    } else {
      // sidebar is now visible → show left chevron to collapse
      icon.classList.replace("fa-chevron-right", "fa-chevron-left");
    }
  });
}

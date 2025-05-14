// @file: src/modules/sidebar/mobileToggle.js
// @version: 1.3 — also reposition toggle button to follow sidebar

/**
 * Sets up the mobile sidebar open/close toggle button,
 * injecting the button into the DOM, swapping Font Awesome chevrons,
 * and repositioning the button to stay attached to the sidebar edge.
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
  // initial position: flush to the right edge of sidebar
  const sidebarWidth = sidebar.getBoundingClientRect().width;
  toggleButton.style.left = `${sidebarWidth}px`;

  // Insert button before sidebar in the DOM
  sidebar.parentNode.insertBefore(toggleButton, sidebar);

  // Click handler: toggle .hidden, swap icon, and reposition toggle
  toggleButton.addEventListener("click", () => {
    const isHidden = sidebar.classList.toggle("hidden");
    const icon = toggleButton.querySelector("i");

    // Swap chevrons
    if (isHidden) {
      icon.classList.replace("fa-chevron-left", "fa-chevron-right");
    } else {
      icon.classList.replace("fa-chevron-right", "fa-chevron-left");
    }

    // Recalculate sidebar width in case of responsive layouts
    const newWidth = sidebar.getBoundingClientRect().width;
    toggleButton.style.left = isHidden
      ? `0px`              // when hidden, button sits at left edge of viewport
      : `${newWidth}px`;   // when visible, button hugs sidebar edge
  });
}

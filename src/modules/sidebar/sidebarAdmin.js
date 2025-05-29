// @file: src/modules/sidebar/sidebarAdmin.js
// @version: 1.2.1 — use admin-tools-panel instead of toggle-group

import { initDefinitionModal } from "../definition/modal/definitionModal.js";

/**
 * Render and wire the “Admin Tools” section at the bottom of the sidebar.
 *
 * @param {HTMLElement} sidebarEl – the <div id="sidebar"> element
 * @param {firebase.firestore.Firestore} db
 */
export function setupSidebarAdmin(sidebarEl, db) {
  // Remove any existing admin section
  sidebarEl.querySelector(".sidebar-section.admin-tools")?.remove();

  // Create the section wrapper
  const section = document.createElement("div");
  section.className = "sidebar-section admin-tools";
  section.id = "sidebar-admin-section";

  // Section header
  const header = document.createElement("h2");
  header.innerHTML = `<i class="fas fa-tools"></i> Admin Tools`;
  section.appendChild(header);

  // Button container (always visible admin panel)
  const buttonWrap = document.createElement("div");
  buttonWrap.className = "admin-tools-panel";

  // Initialize the unified definition modal
  const definitionModal = initDefinitionModal(db);

  // Single “Manage Definitions” button
  const btnManage = document.createElement("button");
  btnManage.textContent = "Manage Definitions";
  btnManage.addEventListener("click", e => definitionModal.openCreate(e, "Item"));
  buttonWrap.appendChild(btnManage);

  section.appendChild(buttonWrap);
  sidebarEl.appendChild(section);

  // Hide for non-admins
  if (!document.body.classList.contains("is-admin")) {
    section.style.display = "none";
  }
}

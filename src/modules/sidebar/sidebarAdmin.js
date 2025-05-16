// @file: src/modules/sidebar/sidebarAdmin.js
// @version: 1.1 — unified “Manage Definitions” button using definitionModal

import { initDefinitionModal } from "../ui/modals/definitionModal.js";

/**
 * Render and wire the “Admin Tools” section at the bottom of the sidebar.
 *
 * @param {HTMLElement} sidebarEl – the <div id="sidebar"> element
 * @param {firebase.firestore.Firestore} db
 */
export function setupSidebarAdmin(sidebarEl, db) {
  // Remove any existing admin header or tools
  sidebarEl.querySelector(".admin-header")?.remove();
  sidebarEl.querySelector("#sidebar-admin-tools")?.remove();

  // Admin header
  const adminHeader = document.createElement("h2");
  adminHeader.className = "admin-header";
  adminHeader.textContent = "🛠 Admin Tools";
  sidebarEl.appendChild(adminHeader);

  // Container for buttons
  const adminWrap = document.createElement("div");
  adminWrap.id = "sidebar-admin-tools";
  sidebarEl.appendChild(adminWrap);

  // Initialize the unified definition modal
  const definitionModal = initDefinitionModal(db);

  // Single “Manage Definitions” button
  const btnManage = document.createElement("button");
  btnManage.textContent = "Manage Definitions";
  btnManage.onclick = e => definitionModal.openCreate(e, "Item");
  adminWrap.appendChild(btnManage);

  // Only show for admins
  if (!document.body.classList.contains("is-admin")) {
    adminHeader.style.display = "none";
    adminWrap.style.display   = "none";
  }
}

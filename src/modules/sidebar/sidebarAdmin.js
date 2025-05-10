// @file: src/modules/sidebar/sidebarAdmin.js
// @version: 1.0 — render admin-only “Manage” buttons in the sidebar

import { initItemDefinitionsModal }  from "../ui/modals/itemDefinitionsModal.js";
import { initChestDefinitionsModal } from "../ui/modals/chestDefinitionsModal.js";

/**
 * Render “Manage Items” and “Manage Chests” buttons for admin users.
 * Appends them under the sidebar.
 *
 * @param {HTMLElement} sidebar — the root #sidebar element
 * @param {FirebaseFirestore.Firestore} db
 */
export function initAdminTools(sidebar, db) {
  // Only show for admins (e.g., <body class="admin">)
  if (!document.body.classList.contains("admin")) {
    return;
  }

  const adminSection = document.createElement("div");
  adminSection.id = "sidebar-admin";
  adminSection.className = "sidebar-section sidebar-admin";

  const title = document.createElement("h3");
  title.textContent = "Admin Tools";
  adminSection.appendChild(title);

  // Manage Items button
  const btnItems = document.createElement("button");
  btnItems.className = "ui-button";
  btnItems.textContent = "Manage Items";
  btnItems.onclick = () => {
    const modal = initItemDefinitionsModal(db);
    modal.open();
  };
  adminSection.appendChild(btnItems);

  // Manage Chests button
  const btnChests = document.createElement("button");
  btnChests.className = "ui-button";
  btnChests.textContent = "Manage Chests";
  btnChests.onclick = () => {
    const modal = initChestDefinitionsModal(db);
    modal.open();
  };
  adminSection.appendChild(btnChests);

  // Insert at bottom of sidebar
  sidebar.appendChild(adminSection);
}

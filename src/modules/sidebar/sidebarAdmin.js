// @file: src/modules/sidebar/sidebarAdmin.js
// @version: 1.1 — added “Manage NPCs” admin button

import { initItemDefinitionsModal }   from "../ui/modals/itemDefinitionsModal.js";
import { initChestDefinitionsModal }  from "../ui/modals/chestDefinitionsModal.js";
import { initNPCDefinitionsModal }    from "../ui/modals/npcDefinitionsModal.js"; 

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
  adminHeader.className    = "admin-header";
  adminHeader.textContent  = "🛠 Admin Tools";
  adminHeader.style.display = "none";
  sidebarEl.appendChild(adminHeader);

  // Container for buttons
  const adminWrap = document.createElement("div");
  adminWrap.id           = "sidebar-admin-tools";
  adminWrap.style.display = "none";

  // Buttons for managing definitions
  [
    ["Manage Items",  () => initItemDefinitionsModal(db).open()],
    ["Manage Chests", () => initChestDefinitionsModal(db).open()],
    ["Manage NPCs",   () => initNPCDefinitionsModal(db).open()]
  ].forEach(([label, fn]) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.onclick     = fn;
    adminWrap.appendChild(btn);
  });

  sidebarEl.appendChild(adminWrap);

  // Only show for admins
  if (document.body.classList.contains("is-admin")) {
    adminHeader.style.display = "";
    adminWrap.style.display   = "";
  }
}

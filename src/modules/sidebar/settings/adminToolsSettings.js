// @file: src/modules/sidebar/settings/adminToolsSettings.js
// @version: 1.0 — admin‐only action buttons

/**
 * Creates the admin tools section in the sidebar settings.
 *
 * @param {{
 *   onManageItems: () => void,
 *   onManageChests: () => void,
 *   onMultiSelectMode: () => void,
 *   onDeleteMode: () => void
 * }} opts
 * @returns {HTMLElement} A container with admin action buttons.
 */
export function createAdminToolsSettings({
  onManageItems,
  onManageChests,
  onMultiSelectMode,
  onDeleteMode
}) {
  const container = document.createElement("div");
  container.className = "sidebar-admin-tools";

  const btnItem = document.createElement("button");
  btnItem.textContent = "Manage Items";
  btnItem.onclick = onManageItems;

  const btnChest = document.createElement("button");
  btnChest.textContent = "Manage Chests";
  btnChest.onclick = onManageChests;

  const btnMulti = document.createElement("button");
  btnMulti.textContent = "Multi-Select Mode";
  btnMulti.onclick = onMultiSelectMode;

  const btnDelete = document.createElement("button");
  btnDelete.textContent = "Delete Mode";
  btnDelete.onclick = onDeleteMode;

  [btnItem, btnChest, btnMulti, btnDelete].forEach(btn => {
    btn.className = "sidebar-btn sidebar-admin-btn";
    container.appendChild(btn);
  });

  return container;
}

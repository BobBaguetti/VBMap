// @file: src/modules/sidebar/settings/sidebarSettings.js
// @version: 1.1 — re-add Admin Tools panel

/**
 * Populates the Settings section (marker/group toggles + admin tools).
 *
 * @param {HTMLElement} container
 * @param {object} callbacks
 * @param {() => void} callbacks.enableGrouping
 * @param {() => void} callbacks.disableGrouping
 * @param {() => void} callbacks.shrinkMarkers
 * @param {() => void} callbacks.resetMarkerSize
 * @param {() => void} callbacks.onManageItems
 * @param {() => void} callbacks.onManageChests
 * @param {() => void} callbacks.onMultiSelectMode
 * @param {() => void} callbacks.onDeleteMode
 */
export function renderSidebarSettings(
  container,
  {
    enableGrouping,
    disableGrouping,
    shrinkMarkers,
    resetMarkerSize,
    onManageItems,
    onManageChests,
    onMultiSelectMode,
    onDeleteMode
  }
) {
  // Remove any old setting groups (but keep the <h2> header intact)
  Array.from(container.querySelectorAll(".setting-group, .admin-tools-group"))
    .forEach(el => el.remove());

  // — User Settings —
  const userGroup = document.createElement("div");
  userGroup.className = "setting-group";

  // Grouping toggle
  const grpLabel = document.createElement("label");
  grpLabel.innerHTML = `<input type="checkbox" id="toggle-grouping"><span>Enable Marker Grouping</span>`;
  const grpCheckbox = grpLabel.querySelector("input");
  grpCheckbox.checked = true;
  grpCheckbox.addEventListener("change", () => {
    grpCheckbox.checked ? enableGrouping() : disableGrouping();
  });
  userGroup.appendChild(grpLabel);

  // Marker size toggle
  const sizeLabel = document.createElement("label");
  sizeLabel.innerHTML = `<input type="checkbox" id="toggle-small-markers"><span>Small Markers (50%)</span>`;
  const sizeCheckbox = sizeLabel.querySelector("input");
  sizeCheckbox.addEventListener("change", () => {
    sizeCheckbox.checked ? shrinkMarkers() : resetMarkerSize();
  });
  userGroup.appendChild(sizeLabel);

  container.appendChild(userGroup);

  // — Admin Tools —
  const adminGroup = document.createElement("div");
  adminGroup.className = "admin-tools-group";

  const heading = document.createElement("h3");
  heading.innerHTML = `<i class="fas fa-tools"></i> Admin Tools`;
  adminGroup.appendChild(heading);

  function makeButton(text, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ui-button";
    btn.textContent = text;
    btn.addEventListener("click", onClick);
    return btn;
  }

  // Manage Items / Chests
  adminGroup.appendChild(makeButton("Manage Items", onManageItems));
  adminGroup.appendChild(makeButton("Manage Chests", onManageChests));
  // Future admin modes
  adminGroup.appendChild(makeButton("Multi-Select Mode", onMultiSelectMode));
  adminGroup.appendChild(makeButton("Delete Mode", onDeleteMode));

  container.appendChild(adminGroup);
}

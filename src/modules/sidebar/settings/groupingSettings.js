// @file: src/modules/sidebar/settings/groupingSettings.js
// @version: 1.1 — default grouping off

/**
 * Populates the Settings section with the grouping toggle.
 *
 * @param {HTMLElement} container
 * @param {object} callbacks
 * @param {() => void} callbacks.enableGrouping
 * @param {() => void} callbacks.disableGrouping
 */
export function renderGroupingSettings(container, { enableGrouping, disableGrouping }) {
  // Remove old grouping settings if present
  container.querySelectorAll(".setting-group").forEach(el => el.remove());

  const group = document.createElement("div");
  group.className = "setting-group";

  const label = document.createElement("label");
  label.innerHTML = `<input type="checkbox" id="toggle-grouping"><span>Enable Marker Grouping</span>`;
  const checkbox = label.querySelector("input");
  checkbox.checked = false; // start ungrouped
  checkbox.addEventListener("change", () => {
    checkbox.checked ? enableGrouping() : disableGrouping();
  });

  group.appendChild(label);
  container.appendChild(group);
}

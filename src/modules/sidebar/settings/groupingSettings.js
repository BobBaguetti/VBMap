// @file: src/modules/sidebar/settings/groupingSettings.js
// @version: 1.0 — marker‐grouping checkbox

/**
 * Creates the “Enable Marker Grouping” setting.
 *
 * @param {{ enableGrouping: () => void, disableGrouping: () => void }} opts
 * @returns {HTMLElement}  A <label> element containing the checkbox.
 */
export function createGroupingSettings({ enableGrouping, disableGrouping }) {
  const label = document.createElement("label");
  label.innerHTML = `
    <input type="checkbox" id="enable-grouping">
    <span>Enable Marker Grouping</span>
  `;

  const checkbox = label.querySelector("input[type=checkbox]");
  checkbox.checked = false;
  checkbox.addEventListener("change", () => {
    console.log("[sidebar] marker grouping:", checkbox.checked);
    checkbox.checked ? enableGrouping() : disableGrouping();
  });

  return label;
}

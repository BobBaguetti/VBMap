// @file: src/modules/sidebar/settings/groupingSettings.js
// @version: 1.1 — dedicated marker‐grouping toggle UI

/**
 * Injects the “Enable Marker Grouping” checkbox into the given container,
 * wiring it to the provided enable/disable callbacks.
 *
 * @param {HTMLElement} container
 * @param {{ enableGrouping: Function, disableGrouping: Function }} svc
 */
export function renderGroupingSettings(container, svc) {
  const label = document.createElement("label");
  label.innerHTML = `
    <input type="checkbox" id="enable-grouping" />
    <span>Enable Marker Grouping</span>
  `;
  container.appendChild(label);

  const cb = label.querySelector("input");
  cb.checked = false;  // off by default
  cb.addEventListener("change", () => {
    console.log("[sidebar] marker grouping:", cb.checked);
    cb.checked ? svc.enableGrouping() : svc.disableGrouping();
  });
}

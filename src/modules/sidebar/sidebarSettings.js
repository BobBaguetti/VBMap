// @file: src/modules/sidebar/sidebarSettings.js
// @version: 1.0 — extract Settings toggles into its own module

/**
 * Render and wire the “Settings” toggles in the sidebar.
 *
 * @param {HTMLElement} settingsSect — the <section id="settings-section"> element
 * @param {{
 *   enableGrouping: () => void,
 *   disableGrouping: () => void
 * }} callbacks
 */
export function setupSidebarSettings(settingsSect, { enableGrouping, disableGrouping }) {
  // Clear any existing labels
  settingsSect.querySelectorAll("label").forEach(l => l.remove());

  // — Enable Marker Grouping toggle —
  const groupingLabel = document.createElement("label");
  groupingLabel.innerHTML = `
    <input type="checkbox" id="enable-grouping" />
    <span>Enable Marker Grouping</span>
  `;
  settingsSect.appendChild(groupingLabel);
  const groupingCb = document.getElementById("enable-grouping");
  groupingCb.checked = false;
  groupingCb.addEventListener("change", () => {
    console.log("[sidebarSettings] marker grouping:", groupingCb.checked);
    groupingCb.checked ? enableGrouping() : disableGrouping();
  });

  // — Small Markers (50%) toggle —
  const smallLabel = document.createElement("label");
  smallLabel.innerHTML = `
    <input type="checkbox" id="toggle-small-markers" />
    <span>Small Markers (50%)</span>
  `;
  settingsSect.appendChild(smallLabel);
  const smallCb = document.getElementById("toggle-small-markers");
  smallCb.checked = false;
  smallCb.addEventListener("change", () => {
    console.log("[sidebarSettings] small markers:", smallCb.checked);
    document.getElementById("map")
      .classList.toggle("small-markers", smallCb.checked);
  });
}

// @file: src/modules/sidebar/settings/markerSizeSettings.js
// @version: 1.0 — small‐marker sizing checkbox

/**
 * Creates the “Small Markers (50%)” size toggle.
 *
 * @param {{ shrinkMarkers: () => void, resetMarkerSize: () => void }} opts
 * @returns {HTMLElement} A <label> containing the checkbox.
 */
export function createMarkerSizeSettings({ shrinkMarkers, resetMarkerSize }) {
  const label = document.createElement("label");
  label.innerHTML = `
    <input type="checkbox" id="toggle-marker-size">
    <span>Small Markers (50%)</span>
  `;

  const checkbox = label.querySelector("input[type=checkbox]");
  checkbox.checked = false;
  checkbox.addEventListener("change", () => {
    console.log("[sidebar] marker size:", checkbox.checked ? "small" : "default");
    checkbox.checked ? shrinkMarkers() : resetMarkerSize();
  });

  return label;
}

// @file: src/modules/sidebar/sidebarSettings.js
// @version: 1.0 — Settings toggles for grouping & clustering

/**
 * Render the Settings section checkboxes and wire their callbacks.
 *
 * @param {HTMLElement} container — the #sidebar-settings element
 * @param {{
 *   enableGrouping: () => void,
 *   disableGrouping: () => void
 * }} callbacks
 */
export function initSettings(container, { enableGrouping, disableGrouping }) {
  // Clear any existing content
  container.innerHTML = "";

  // Group Markers Toggle
  const groupWrapper = document.createElement("div");
  groupWrapper.className = "settings-row";
  const groupLabel = document.createElement("label");
  groupLabel.textContent = "Group Markers";
  const groupCheckbox = document.createElement("input");
  groupCheckbox.type = "checkbox";
  groupCheckbox.checked = true; // default grouped
  groupCheckbox.onchange = () => {
    if (groupCheckbox.checked) {
      enableGrouping();
    } else {
      disableGrouping();
    }
  };
  groupWrapper.append(groupLabel, groupCheckbox);

  // Cluster Toggle (small vs flat)
  const clusterWrapper = document.createElement("div");
  clusterWrapper.className = "settings-row";
  const clusterLabel = document.createElement("label");
  clusterLabel.textContent = "Use Clusters";
  const clusterCheckbox = document.createElement("input");
  clusterCheckbox.type = "checkbox";
  clusterCheckbox.checked = true; // default clustering
  clusterCheckbox.onchange = () => {
    if (clusterCheckbox.checked) {
      enableGrouping();    // reuse grouping logic for clusters
    } else {
      disableGrouping();
    }
  };
  clusterWrapper.append(clusterLabel, clusterCheckbox);

  container.append(groupWrapper, clusterWrapper);
}

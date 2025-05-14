// @file: src/modules/sidebar/masterToggle.js
// @version: 1.0 — extracted master collapse-all & eye-all controls

/**
 * Sets up the master eye toggle and collapse-all chevron.
 *
 * @param {object} params
 * @param {string} params.sectionSelector      – selector for the filters section container
 * @param {string} params.filterGroupSelector  – selector for individual filter-group containers
 * @returns {{
 *   updateMasterCollapseIcon: () => void,
 *   updateMasterEyeIcon: () => void
 * }}
 */
export function setupMasterControls({
  sectionSelector     = "#filters-section",
  filterGroupSelector = ".filter-group"
}) {
  let updateMasterCollapseIcon = () => {};
  let updateMasterEyeIcon     = () => {};

  const filtersSection = document.querySelector(sectionSelector);
  if (!filtersSection) {
    console.warn("[sidebarMasterControls] Missing:", sectionSelector);
    return { updateMasterCollapseIcon, updateMasterEyeIcon };
  }
  const header = filtersSection.querySelector("h2");
  if (!header) {
    console.warn("[sidebarMasterControls] Missing H2 in:", sectionSelector);
    return { updateMasterCollapseIcon, updateMasterEyeIcon };
  }

  // Master Eye Toggle
  const masterEye = document.createElement("i");
  masterEye.classList.add("fas", "fa-eye", "filter-eye");
  masterEye.style.cursor     = "pointer";
  masterEye.style.marginLeft = "0.5em";
  header.appendChild(masterEye);

  updateMasterEyeIcon = () => {
    const cbs = Array.from(
      document.querySelectorAll(`${sectionSelector} .toggle-group input[type=checkbox]`)
    );
    if (!cbs.length) return;
    const anyChecked = cbs.some(cb => cb.checked);
    masterEye.classList.toggle("fa-eye",       anyChecked);
    masterEye.classList.toggle("fa-eye-slash", !anyChecked);
  };
  updateMasterEyeIcon();

  masterEye.addEventListener("click", e => {
    e.stopPropagation();
    const cbs = Array.from(
      document.querySelectorAll(`${sectionSelector} .toggle-group input[type=checkbox]`)
    );
    if (!cbs.length) return;
    const newState = cbs.some(cb => !cb.checked);
    cbs.forEach(cb => {
      cb.checked = newState;
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    });
    // Disable/enable groups visually
    document.querySelectorAll(filterGroupSelector).forEach(group => {
      group.classList.toggle("disabled", !newState);
    });
    updateMasterEyeIcon();
    // After toggling all filters, also refresh collapse icon
    updateMasterCollapseIcon();
  });

  // Master Collapse-All Chevron
  const collapseBtn = document.createElement("i");
  collapseBtn.classList.add("fas", "collapse-all", "fa-chevron-right");
  Object.assign(collapseBtn.style, {
    position:   "absolute",
    right:      "0.6em",
    top:        "50%",
    transform:  "translateY(-50%)",
    cursor:     "pointer",
    transition: "color 0.2s"
  });
  header.appendChild(collapseBtn);

  const getSubGroups = () =>
    Array.from(filtersSection.querySelectorAll(filterGroupSelector));

  updateMasterCollapseIcon = () => {
    const allCollapsed = getSubGroups().every(g => g.classList.contains("collapsed"));
    collapseBtn.classList.replace(
      allCollapsed ? "fa-chevron-down" : "fa-chevron-right",
      allCollapsed ? "fa-chevron-right" : "fa-chevron-down"
    );
  };
  updateMasterCollapseIcon();

  collapseBtn.addEventListener("click", e => {
    e.stopPropagation();
    const groups       = getSubGroups();
    const allCollapsed = groups.every(g => g.classList.contains("collapsed"));
    groups.forEach(group => {
      const shouldCollapse = !allCollapsed;
      if (group.classList.contains("collapsed") === shouldCollapse) return;
      // simulate one group toggle so CSS/JS hide runs
      group.querySelector("h3, h4").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    // Sync icons after all toggles
    updateMasterCollapseIcon();
  });

  return { updateMasterCollapseIcon, updateMasterEyeIcon };
}

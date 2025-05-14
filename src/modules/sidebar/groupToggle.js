// @file: src/modules/sidebar/groupToggle.js
// @version: 1.0 — extracted per-group collapse & eye-toggle logic

/**
 * Initialize per-group collapse/expand chevrons and eye toggles.
 *
 * @param {object} params
 * @param {string}   params.filterGroupSelector      – selector for filter-group containers
 * @param {number}   params.collapseDuration         – collapse animation duration in ms
 * @param {number}   params.prehideOffset            – ms before end to hide content
 * @param {function} params.onUpdateMasterCollapse   – callback after any group toggles collapse
 * @param {function} params.onUpdateMasterEye        – callback after any group toggles eye
 */
export function setupGroupToggle({
  filterGroupSelector    = ".filter-group",
  collapseDuration       = 300,
  prehideOffset          = 68,
  onUpdateMasterCollapse = () => {},
  onUpdateMasterEye      = () => {}
}) {
  // Animate a single group's collapse/expand
  function animateToggle(group) {
    const container   = group.querySelector(".toggle-group");
    const isCollapsed = group.classList.contains("collapsed");

    container.style.transition = "none";
    container.style.maxHeight  = isCollapsed
      ? "0px"
      : `${container.scrollHeight}px`;
    container.offsetHeight;
    container.style.transition = `max-height ${collapseDuration}ms ease-in-out`;

    if (isCollapsed) {
      container.style.visibility = "visible";
      group.classList.remove("collapsed");
      container.style.maxHeight = `${container.scrollHeight}px`;
    } else {
      container.style.removeProperty("visibility");
      group.classList.add("collapsed");
      container.style.maxHeight = "0px";
      setTimeout(
        () => container.style.visibility = "hidden",
        collapseDuration - prehideOffset
      );
    }
  }

  // Wire up each group
  document.querySelectorAll(filterGroupSelector).forEach(group => {
    const header = group.querySelector("h3, h4");
    if (!header) return;

    // collapse chevron
    const toggleIcon = document.createElement("i");
    toggleIcon.classList.add(
      "fas",
      group.classList.contains("collapsed") ? "fa-chevron-right" : "fa-chevron-down",
      "group-toggle"
    );
    toggleIcon.style.cursor     = "pointer";
    toggleIcon.style.marginLeft = "0.5em";
    header.appendChild(toggleIcon);

    // eye-toggle
    const eye = document.createElement("i");
    eye.classList.add("fas", "fa-eye", "filter-eye");
    eye.style.cursor     = "pointer";
    eye.style.marginLeft = "0.5em";
    header.appendChild(eye);

    // header click toggles collapse
    header.addEventListener("click", () => {
      animateToggle(group);
      onUpdateMasterCollapse();
      toggleIcon.classList.toggle("fa-chevron-right");
      toggleIcon.classList.toggle("fa-chevron-down");
    });

    // direct chevron click
    toggleIcon.addEventListener("click", e => {
      e.stopPropagation();
      animateToggle(group);
      onUpdateMasterCollapse();
      toggleIcon.classList.toggle("fa-chevron-right");
      toggleIcon.classList.toggle("fa-chevron-down");
    });

    // eye-toggle click
    eye.addEventListener("click", e => {
      e.stopPropagation();
      const inputs = group.querySelectorAll("input[type=checkbox]");
      const anyOff = Array.from(inputs).some(cb => !cb.checked);
      inputs.forEach(cb => {
        cb.checked = anyOff;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      });
      group.classList.toggle("disabled", !anyOff);
      eye.classList.toggle("fa-eye-slash", !anyOff);
      eye.classList.toggle("fa-eye",       anyOff);
      onUpdateMasterCollapse();
      onUpdateMasterEye();
    });
  });
}

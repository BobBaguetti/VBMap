// @file: src/modules/sidebar/groupToggle.js
// @version: 1.2 — added reappearOffset parameter; delay entry visibility on expand

/**
 * Initialize per-group collapse/expand chevrons and eye toggles.
 *
 * @param {object} params
 * @param {string}   params.filterGroupSelector      – selector for filter-group containers
 * @param {number}   params.collapseDuration         – collapse animation duration in ms
 * @param {number}   params.prehideOffset            – ms before end to hide content when collapsing
 * @param {number}   params.reappearOffset           – ms after start to show content when expanding
 * @param {function} params.onUpdateMasterCollapse   – callback after any group toggles collapse
 * @param {function} params.onUpdateMasterEye        – callback after any group toggles eye
 */
export function setupGroupToggle({
  filterGroupSelector    = ".filter-group",
  collapseDuration       = 300,
  prehideOffset          = 0,
  reappearOffset         = 0,
  onUpdateMasterCollapse = () => {},
  onUpdateMasterEye      = () => {}
}) {
  // Animate a single group's collapse/expand
  function animateToggle(group) {
    const container   = group.querySelector(".toggle-group");
    const isCollapsed = group.classList.contains("collapsed");

    // reset any existing timers on this container
    if (container._reappearTimer) {
      clearTimeout(container._reappearTimer);
      container._reappearTimer = null;
    }

    container.style.transition = "none";
    container.style.maxHeight  = isCollapsed
      ? "0px"
      : `${container.scrollHeight}px`;
    container.offsetHeight;
    container.style.transition = `max-height ${collapseDuration}ms ease-in-out`;

    if (isCollapsed) {
      // EXPANDING: start hidden, then reveal after reappearOffset
      container.style.visibility = "hidden";
      group.classList.remove("collapsed");
      container.style.maxHeight = `${container.scrollHeight}px`;

      container._reappearTimer = setTimeout(() => {
        container.style.visibility = "visible";
        container._reappearTimer = null;
      }, reappearOffset);
    } else {
      // COLLAPSING: hide at end minus prehideOffset
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

    // eye-toggle click toggles all filters in group
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

    // sync this group's eye icon when any individual checkbox changes
    group.querySelectorAll(".toggle-group input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", () => {
        const anyOn = Array.from(
          group.querySelectorAll(".toggle-group input[type=checkbox]")
        ).some(i => i.checked);
        eye.classList.toggle("fa-eye",       anyOn);
        eye.classList.toggle("fa-eye-slash", !anyOn);
        // propagate change up to master eye
        onUpdateMasterEye();
      });
    });
  });
}

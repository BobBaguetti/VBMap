// @file: src/modules/sidebar/groupToggle.js
// @version: 1.7 — delegated click handling to survive inline-SVG replacement

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
  function animateToggle(group) {
    const container   = group.querySelector(".toggle-group");
    const isCollapsed = group.classList.contains("collapsed");
    if (container._reappearTimer) clearTimeout(container._reappearTimer);

    container.style.transition = "none";
    container.style.maxHeight  = isCollapsed
      ? "0px"
      : `${container.scrollHeight}px`;
    container.offsetHeight; // force reflow
    container.style.transition = `max-height ${collapseDuration}ms ease-in-out`;

    if (isCollapsed) {
      // expanding
      container.style.visibility = "hidden";
      group.classList.remove("collapsed");
      container.style.maxHeight = `${container.scrollHeight}px`;
      container._reappearTimer = setTimeout(() => {
        container.style.visibility = "visible";
        container._reappearTimer = null;
      }, reappearOffset);
    } else {
      // collapsing
      container.style.removeProperty("visibility");
      group.classList.add("collapsed");
      container.style.maxHeight = "0px";
      setTimeout(
        () => container.style.visibility = "hidden",
        collapseDuration - prehideOffset
      );
    }
  }

  function syncEye(eye, group, container) {
    const anyOn = Array.from(container.querySelectorAll("input[type=checkbox]"))
      .some(cb => cb.checked);
    eye.classList.toggle("fa-eye", anyOn);
    eye.classList.toggle("fa-eye-slash", !anyOn);
    onUpdateMasterEye();
  }

  document.querySelectorAll(filterGroupSelector).forEach(group => {
    const header    = group.querySelector("h3, h4");
    const container = group.querySelector(".toggle-group");
    if (!header || !container) return;

    // create collapse chevron
    const toggleIcon = document.createElement("i");
    toggleIcon.classList.add(
      "fas",
      group.classList.contains("collapsed") ? "fa-chevron-right" : "fa-chevron-down",
      "group-toggle"
    );
    toggleIcon.style.cursor = "pointer";
    header.appendChild(toggleIcon);

    // create eye-toggle
    const eye = document.createElement("i");
    eye.classList.add("fas", "filter-eye", "fa-eye");
    eye.style.cursor = "pointer";
    header.appendChild(eye);

    // initial eye state
    if (window.requestAnimationFrame) {
      requestAnimationFrame(() => syncEye(eye, group, container));
    } else {
      setTimeout(() => syncEye(eye, group, container), 0);
    }

    // keep eye in sync on dynamic checkbox changes
    new MutationObserver(() => syncEye(eye, group, container))
      .observe(container, { childList: true, subtree: true });

    // delegated click handler on header
    header.addEventListener("click", e => {
      const clickedToggle = e.target.closest(".group-toggle");
      const clickedEye    = e.target.closest(".filter-eye");

      if (clickedToggle) {
        // collapse/expand
        e.stopPropagation();
        animateToggle(group);
        onUpdateMasterCollapse();
        toggleIcon.classList.toggle("fa-chevron-right");
        toggleIcon.classList.toggle("fa-chevron-down");

      } else if (clickedEye) {
        // toggle all checkboxes in group
        e.stopPropagation();
        const inputs = container.querySelectorAll("input[type=checkbox]");
        const anyOff = Array.from(inputs).some(cb => !cb.checked);
        inputs.forEach(cb => {
          cb.checked = anyOff;
          cb.dispatchEvent(new Event("change", { bubbles: true }));
        });
        group.classList.toggle("disabled", !anyOff);
        syncEye(eye, group, container);
        onUpdateMasterCollapse();

      } else {
        // click anywhere else on header also collapses
        animateToggle(group);
        onUpdateMasterCollapse();
        toggleIcon.classList.toggle("fa-chevron-right");
        toggleIcon.classList.toggle("fa-chevron-down");
      }
    });

    // keep eye icon updated when individual checkboxes change
    container.addEventListener("change", e => {
      if (e.target.matches("input[type=checkbox]")) {
        syncEye(eye, group, container);
      }
    });
  });
}

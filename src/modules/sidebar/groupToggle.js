// @file: src/modules/sidebar/groupToggle.js
// @version: 1.6 — observe dynamic additions of checkboxes and re-sync eye

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
    container.offsetHeight;
    container.style.transition = `max-height ${collapseDuration}ms ease-in-out`;

    if (isCollapsed) {
      container.style.visibility = "hidden";
      group.classList.remove("collapsed");
      container.style.maxHeight = `${container.scrollHeight}px`;
      container._reappearTimer = setTimeout(() => {
        container.style.visibility = "visible";
        container._reappearTimer = null;
      }, reappearOffset);
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

  document.querySelectorAll(filterGroupSelector).forEach(group => {
    const header    = group.querySelector("h3, h4");
    const container = group.querySelector(".toggle-group");
    if (!header || !container) return;

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

    // eye-toggle (default on)
    const eye = document.createElement("i");
    eye.classList.add("fas", "filter-eye", "fa-eye");
    eye.style.cursor     = "pointer";
    eye.style.marginLeft = "0.5em";
    header.appendChild(eye);

    // sync helper
    function syncEye() {
      const anyOn = Array.from(container.querySelectorAll("input[type=checkbox]"))
        .some(cb => cb.checked);
      eye.classList.toggle("fa-eye", anyOn);
      eye.classList.toggle("fa-eye-slash", !anyOn);
      onUpdateMasterEye();
    }

    // defer initial sync
    if (window.requestAnimationFrame) {
      requestAnimationFrame(syncEye);
    } else {
      setTimeout(syncEye, 0);
    }

    // observe additions/removals of checkboxes
    const observer = new MutationObserver(syncEye);
    observer.observe(container, { childList: true, subtree: true });

    // collapse toggles
    const doToggle = e => {
      if (e) e.stopPropagation();
      animateToggle(group);
      onUpdateMasterCollapse();
      toggleIcon.classList.toggle("fa-chevron-right");
      toggleIcon.classList.toggle("fa-chevron-down");
    };
    header.addEventListener("click", doToggle);
    toggleIcon.addEventListener("click", doToggle);

    // eye-click toggles all filters in group
    eye.addEventListener("click", e => {
      e.stopPropagation();
      const inputs = container.querySelectorAll("input[type=checkbox]");
      const anyOff = Array.from(inputs).some(cb => !cb.checked);
      inputs.forEach(cb => {
        cb.checked = anyOff;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      });
      group.classList.toggle("disabled", !anyOff);
      syncEye();
      onUpdateMasterCollapse();
    });

    // delegate change events for real-time sync
    container.addEventListener("change", e => {
      if (e.target.matches("input[type=checkbox]")) {
        syncEye();
      }
    });
  });
}

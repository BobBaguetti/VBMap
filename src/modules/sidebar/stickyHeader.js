// @file: src/modules/sidebar/stickyHeader.js
// @version: 1.0 — extracted sticky Filters-section header behavior

/**
 * Initializes sticky behavior for a sidebar section using IntersectionObserver.
 *
 * @param {object} params
 * @param {string} params.sectionSelector – selector for the section to observe
 * @param {string} params.stuckClass      – class to add when section is out of view
 * @param {number[]} params.threshold     – IntersectionObserver thresholds
 */
export function setupStickyHeader({
  sectionSelector = "#filters-section",
  stuckClass      = "stuck",
  threshold       = [1]
}) {
  const section = document.querySelector(sectionSelector);
  if (!section) {
    console.warn("[sidebarStickyHeader] Missing element:", sectionSelector);
    return;
  }
  const observer = new IntersectionObserver(
    ([entry]) => section.classList.toggle(stuckClass, entry.intersectionRatio < 1),
    { threshold }
  );
  observer.observe(section);
}

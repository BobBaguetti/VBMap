// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.34 — wire About toolbar button to draggable About modal

import { setupSidebarSearch }   from "./search.js";
import { setupSidebarMobileToggle } from "./mobileToggle.js";
import { setupStickyHeader }    from "./stickyHeader.js";
import { setupGroupToggle }     from "./groupToggle.js";
import { setupMasterControls }  from "./masterToggle.js";
import { setupSettingsModal }   from "./settingsModal.js";
import { setupAboutModal }      from "./aboutModal.js";     // NEW

export function setupSidebarUI({
  map,
  sidebarSelector         = "#sidebar",
  toggleSelector          = "#sidebar-toggle",
  searchBarSelector       = "#search-bar",
  filterGroupSelector     = ".filter-group",
  settingsButtonSelector  = "#btn-settings",
  aboutButtonSelector     = "#btn-about"
}) {
  const COLLAPSE_DURATION = 300;
  const PREHIDE_OFFSET    = 68;
  const REAPPEAR_OFFSET   = 25;

  /* ── Search bar ─────────────────────────────────────────────── */
  setupSidebarSearch({
    searchBarSelector,
    clearButtonSelector: "#search-clear"
  });

  /* ── Mobile sidebar toggle ──────────────────────────────────── */
  setupSidebarMobileToggle({
    sidebarSelector,
    toggleSelector
  });

  /* ── Sticky Filters header ──────────────────────────────────── */
  setupStickyHeader({
    sectionSelector: "#filters-section",
    stuckClass:      "stuck",
    threshold:       [1]
  });

  /* ── Master controls (collapse/eye-all) ─────────────────────── */
  const { updateMasterCollapseIcon, updateMasterEyeIcon } = setupMasterControls({
    sectionSelector:     "#filters-section",
    filterGroupSelector
  });

  /* ── Per-group collapse & eye toggles ───────────────────────── */
  setupGroupToggle({
    filterGroupSelector,
    collapseDuration:       COLLAPSE_DURATION,
    prehideOffset:          PREHIDE_OFFSET,
    reappearOffset:         REAPPEAR_OFFSET,
    onUpdateMasterCollapse: updateMasterCollapseIcon,
    onUpdateMasterEye:      updateMasterEyeIcon
  });

  /* ── Settings modal ─────────────────────────────────────────── */
  setupSettingsModal({ buttonSelector: settingsButtonSelector });

  /* ── About modal ────────────────────────────────────────────── */
  setupAboutModal({ buttonSelector: aboutButtonSelector });
}

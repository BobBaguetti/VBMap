// @file: src/modules/sidebar/sidebarUI.js
// @version: 1.32 — wire Settings toolbar button to open settings modal

import { setupSidebarSearch }       from "./search.js";
import { setupSidebarMobileToggle } from "./mobileToggle.js";
import { setupStickyHeader }        from "./stickyHeader.js";
import { setupGroupToggle }         from "./groupToggle.js";
import { setupMasterControls }      from "./masterToggle.js";
import { setupSettingsModal }       from "./settingsModal.js";

export function setupSidebarUI({
  map,
  sidebarSelector       = "#sidebar",
  toggleSelector        = "#sidebar-toggle",
  searchBarSelector     = "#search-bar",
  filterGroupSelector   = ".filter-group",
  settingsButtonSelector= "#btn-settings"
}) {
  const COLLAPSE_DURATION = 300;
  const PREHIDE_OFFSET    = 68;
  const REAPPEAR_OFFSET   = 25;

  // 1) Search bar
  setupSidebarSearch({
    searchBarSelector,
    clearButtonSelector: "#search-clear"
  });

  // 2) Mobile sidebar toggle
  setupSidebarMobileToggle({
    sidebarSelector,
    toggleSelector
  });

  // 3) Sticky Filters header
  setupStickyHeader({
    sectionSelector: "#filters-section",
    stuckClass:      "stuck",
    threshold:       [1]
  });

  // 4) Master controls
  const { updateMasterCollapseIcon, updateMasterEyeIcon } = setupMasterControls({
    sectionSelector:     "#filters-section",
    filterGroupSelector
  });

  // 5) Per-group collapse & eye toggles
  setupGroupToggle({
    filterGroupSelector,
    collapseDuration:       COLLAPSE_DURATION,
    prehideOffset:          PREHIDE_OFFSET,
    reappearOffset:         REAPPEAR_OFFSET,
    onUpdateMasterCollapse: updateMasterCollapseIcon,
    onUpdateMasterEye:      updateMasterEyeIcon
  });

  // 6) Settings modal
  setupSettingsModal({ buttonSelector: settingsButtonSelector });
}

// @file: src/modules/sidebar/settings/sidebarSettings.js
// @version: 1.0 — aggregate all sidebar settings widgets

import { createGroupingSettings }    from "./groupingSettings.js";
import { createMarkerSizeSettings }  from "./markerSizeSettings.js";
import { createAdminToolsSettings }  from "./adminToolsSettings.js";

/**
 * Renders the complete Settings section in the sidebar.
 *
 * @param {HTMLElement} settingsContainer – the <div> where settings belong
 * @param {object} callbacks
 * @param {() => void} callbacks.enableGrouping
 * @param {() => void} callbacks.disableGrouping
 * @param {() => void} callbacks.shrinkMarkers
 * @param {() => void} callbacks.resetMarkerSize
 * @param {() => void} callbacks.onManageItems
 * @param {() => void} callbacks.onManageChests
 * @param {() => void} callbacks.onMultiSelectMode
 * @param {() => void} callbacks.onDeleteMode
 */
export function renderSidebarSettings(settingsContainer, callbacks) {
  // Clear any existing settings
  settingsContainer.innerHTML = "";

  // Marker Grouping toggle
  settingsContainer.appendChild(
    createGroupingSettings({
      enableGrouping:  callbacks.enableGrouping,
      disableGrouping: callbacks.disableGrouping
    })
  );

  // Marker Size toggle
  settingsContainer.appendChild(
    createMarkerSizeSettings({
      shrinkMarkers:    callbacks.shrinkMarkers,
      resetMarkerSize:  callbacks.resetMarkerSize
    })
  );

  // Admin tools buttons
  settingsContainer.appendChild(
    createAdminToolsSettings({
      onManageItems:     callbacks.onManageItems,
      onManageChests:    callbacks.onManageChests,
      onMultiSelectMode: callbacks.onMultiSelectMode,
      onDeleteMode:      callbacks.onDeleteMode
    })
  );
}

// @file: src/modules/sidebar/settingsModal.js
// @version: 1.3 — switch to createSettingsModal()

import { createSettingsModal } from "../../../shared/ui/core/createSettingsModal.js";

export function setupSettingsModal({ buttonSelector }) {
  const btn = document.querySelector(buttonSelector);
  if (!btn) {
    console.warn("[settingsModal] Button not found:", buttonSelector);
    return;
  }

  // 1) Instantiate modal via factory
  const { modal, slots, position } = createSettingsModal({
    id:      "settings-modal",
    title:   "Settings",
    onClose: null,
    initialOffset: { x: 12, y: 64 }
  });

  // 2) Populate body
  slots.body.innerHTML = `
    <label>
      <input type="checkbox" id="toggle-grouping"/>
      Enable Marker Grouping
    </label>
    <label>
      <input type="checkbox" id="toggle-small-markers"/>
      Small Markers (50%)
    </label>
  `;

  // 3) Wire toolbar button
  btn.addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar");
    position(sidebar?.getBoundingClientRect());
    modal.open();
  });
}

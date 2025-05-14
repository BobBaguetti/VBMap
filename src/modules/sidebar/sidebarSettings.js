// @file: src/modules/sidebar/sidebarSettings.js
// @version: 1.1 — render settings toggles in a modal opened by the toolbar button

/**
 * Sets up the Settings modal and wires the Settings button.
 *
 * @param {object} callbacks
 * @param {() => void} callbacks.enableGrouping
 * @param {() => void} callbacks.disableGrouping
 */
export function setupSidebarSettings({ enableGrouping, disableGrouping }) {
  const btnSettings = document.getElementById("btn-settings");
  if (!btnSettings) {
    console.warn("[sidebarSettings] Settings button not found");
    return;
  }

  // Create modal container (hidden by default)
  let modal;
  function createModal() {
    modal = document.createElement("div");
    modal.id = "settings-modal";
    modal.classList.add("modal", "hidden");
    modal.innerHTML = `
      <div class="modal-content">
        <header>
          <h3>Settings</h3>
          <button id="settings-close" aria-label="Close">&times;</button>
        </header>
        <div class="modal-body">
          <label>
            <input type="checkbox" id="enable-grouping"/>
            <span>Enable Marker Grouping</span>
          </label>
          <label>
            <input type="checkbox" id="toggle-small-markers"/>
            <span>Small Markers (50%)</span>
          </label>
        </div>
      </div>
      <div class="modal-backdrop"></div>
    `;
    document.body.append(modal);

    // Wire close
    modal.querySelector("#settings-close")
      .addEventListener("click", hideModal);
    modal.querySelector(".modal-backdrop")
      .addEventListener("click", hideModal);

    // Wire toggles
    const groupingCb = modal.querySelector("#enable-grouping");
    groupingCb.checked = false;
    groupingCb.addEventListener("change", () => {
      groupingCb.checked ? enableGrouping() : disableGrouping();
    });

    const smallCb = modal.querySelector("#toggle-small-markers");
    smallCb.checked = false;
    smallCb.addEventListener("change", () => {
      document.getElementById("map")
        .classList.toggle("small-markers", smallCb.checked);
    });
  }

  function showModal() {
    if (!modal) createModal();
    modal.classList.remove("hidden");
  }

  function hideModal() {
    modal.classList.add("hidden");
  }

  btnSettings.addEventListener("click", showModal);
}

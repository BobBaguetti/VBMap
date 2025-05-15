// @file: src/modules/sidebar/settingsModal.js
// @version: 1.0 — implements a modal dialog for sidebar settings

/**
 * Creates and wires a settings modal, toggled by the toolbar button.
 *
 * @param {object} params
 * @param {string} params.buttonSelector – selector for the Settings toolbar button
 */
export function setupSettingsModal({ buttonSelector }) {
  const btn = document.querySelector(buttonSelector);
  if (!btn) {
    console.warn("[settingsModal] Button not found:", buttonSelector);
    return;
  }

  // Build modal structure
  const modal = document.createElement("div");
  modal.id = "settings-modal";
  modal.classList.add("modal", "hidden"); // hidden by default

  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <header>
        <h3>Settings</h3>
        <button class="modal-close" aria-label="Close">&times;</button>
      </header>
      <section class="modal-body">
        <label>
          <input type="checkbox" id="toggle-grouping"/>
          Enable Marker Grouping
        </label>
        <label>
          <input type="checkbox" id="toggle-small-markers"/>
          Small Markers (50%)
        </label>
        <!-- add more settings here -->
      </section>
      <footer>
        <button class="modal-close">Close</button>
      </footer>
    </div>
  `.trim();

  document.body.appendChild(modal);

  const overlay = modal.querySelector(".modal-overlay");
  const closeButtons = modal.querySelectorAll(".modal-close");

  function open() {
    modal.classList.remove("hidden");
  }
  function close() {
    modal.classList.add("hidden");
  }

  // Toggle on Settings button click
  btn.addEventListener("click", open);

  // Close on overlay or close-button click
  overlay.addEventListener("click", close);
  closeButtons.forEach(b => b.addEventListener("click", close));
}

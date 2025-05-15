// @file: src/modules/sidebar/settingsModal.js
// @version: 1.1 — robust button detection & event‑delegation

/**
 * Creates and wires a settings modal, toggled by the toolbar button.
 *
 * @param {object} params
 * @param {string} params.buttonSelector – selector for the Settings toolbar button
 */
export function setupSettingsModal({ buttonSelector = "#btn-settings" }) {
  // Build modal element once and append to <body>
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
      </section>
      <footer>
        <button class="modal-close">Close</button>
      </footer>
    </div>
  `.trim();
  document.body.appendChild(modal);

  const overlay      = modal.querySelector(".modal-overlay");
  const closeButtons = modal.querySelectorAll(".modal-close");
  const openModal    = () => modal.classList.remove("hidden");
  const closeModal   = () => modal.classList.add("hidden");

  // Global delegation — works even if the button isn’t in the DOM yet
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(buttonSelector);
    if (btn) {
      openModal();
      e.preventDefault();
    }
  });

  // Close interactions
  overlay.addEventListener("click", closeModal);
  closeButtons.forEach(b => b.addEventListener("click", closeModal));
}

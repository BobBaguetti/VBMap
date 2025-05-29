// @file: src/modules/sidebar/aboutModal.js
// @version: 1.1 — static centered dialog (no drag), wider layout

/**
 * Creates and wires a centered About dialog.
 *
 * @param {object} params
 * @param {string} params.buttonSelector – selector for the About toolbar button
 */
export function setupAboutModal({ buttonSelector }) {
  const btn = document.querySelector(buttonSelector);
  if (!btn) {
    console.warn("[aboutModal] Button not found:", buttonSelector);
    return;
  }

  /* ── Build dialog markup ───────────────────────────────────────── */
  const dialog = document.createElement("div");
  dialog.id = "about-modal";
  dialog.classList.add("centered", "hidden");  // hidden by default

  dialog.innerHTML = `
    <div class="modal-content">
      <header>
        <h3>About&nbsp;This&nbsp;Map</h3>
        <button class="modal-close" aria-label="Close">&times;</button>
      </header>
      <section class="modal-body">
        <p><strong>Vaultbreakers Map</strong> is an unofficial community tool that
           helps you locate loot, quests, NPCs, and more. Lorem Ipsum and all that</p>
        <p>
          <em>Version:</em> 0.9.0<br/>
          <em>Maintainer:</em> Bobber Baguetter<br/>
        </p>
      </section>
    </div>
  `.trim();

  document.body.appendChild(dialog);

  const closeBtn = dialog.querySelector(".modal-close");

  /* ── Open / Close helpers ──────────────────────────────────────── */
  function open()  { dialog.classList.remove("hidden"); }
  function close() { dialog.classList.add("hidden"); }
  function toggle() {
    dialog.classList.contains("hidden") ? open() : close();
  }

  btn.addEventListener("click", toggle);
  closeBtn.addEventListener("click", close);
}

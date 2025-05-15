// @file: src/modules/sidebar/aboutModal.js
// @version: 1.0 — floating, draggable About panel

/**
 * Creates and wires a draggable About panel.
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

  /* ── Build panel markup ─────────────────────────────────────────── */
  const panel = document.createElement("div");
  panel.id = "about-modal";
  panel.classList.add("floating", "hidden"); // hidden by default

  panel.innerHTML = `
    <div class="modal-content">
      <header class="drag-handle">
        <h3>About This Map</h3>
        <button class="modal-close" aria-label="Close">&times;</button>
      </header>
      <section class="modal-body">
        <p><strong>Vaultbreakers Map</strong> is an
           unofficial interactive map built by the
           community to help you track loot, quests,
           NPCs and more. Data is synced live from
           Firebase and curated by volunteer admins.</p>
        <p>
          • <em>Version:</em> 0.9.0<br/>
          • <em>Maintainer:</em> Bob Baguetti<br/>
          • <em>GitHub:</em> <a href="https://github.com/Vibecoder/VBMap"
                               target="_blank">VBMap repo</a>
        </p>
      </section>
    </div>
  `.trim();

  document.body.appendChild(panel);

  const closeBtn = panel.querySelector(".modal-close");

  /* ── Position: right of sidebar, 80 px down ─────────────────────── */
  const INITIAL_TOP_OFFSET = 80;
  function positionNextToSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    const rect = sidebar.getBoundingClientRect();
    panel.style.left = `${rect.right + 12}px`;
    panel.style.top  = `${rect.top + INITIAL_TOP_OFFSET}px`;
  }

  /* ── Open / Close helpers ───────────────────────────────────────── */
  function open() {
    panel.classList.remove("hidden");
    if (!panel.dataset.moved) positionNextToSidebar();
  }
  function close() {
    panel.classList.add("hidden");
  }
  function toggle() {
    panel.classList.contains("hidden") ? open() : close();
  }

  /* ── Wire events ────────────────────────────────────────────────── */
  btn.addEventListener("click", toggle);
  closeBtn.addEventListener("click", close);

  /* ── Drag behaviour (header is handle) ──────────────────────────── */
  const handle = panel.querySelector(".drag-handle");
  let startX, startY, startLeft, startTop;

  handle.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    const rect = panel.getBoundingClientRect();
    startLeft = rect.left;
    startTop  = rect.top;

    function onMove(ev) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      panel.style.left = `${startLeft + dx}px`;
      panel.style.top  = `${startTop  + dy}px`;
      panel.dataset.moved = "true";
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  });
}

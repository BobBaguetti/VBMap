// @file: src/modules/sidebar/settingsModal.js
// @version: 1.3 — added login/logout button

import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from "firebase/auth";

/**
 * Creates and wires a draggable, floating Settings panel.
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

  /* ── Build panel markup ─────────────────────────────────────────── */
  const panel = document.createElement("div");
  panel.id = "settings-modal";
  panel.classList.add("floating", "hidden"); // hidden by default

  panel.innerHTML = `
    <div class="modal-content">
      <header class="drag-handle">
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
        <hr/>
        <div id="auth-button-container">
          <button id="auth-button">Log In</button>
        </div>
      </section>
    </div>
  `.trim();

  document.body.appendChild(panel);
  const closeBtn = panel.querySelector(".modal-close");

  /* ── Position: right of sidebar, 64 px down ─────────────────────── */
  const INITIAL_TOP_OFFSET = 64;
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

  /* ── Wire open/close events ─────────────────────────────────────── */
  btn.addEventListener("click", toggle);
  closeBtn.addEventListener("click", close);

  /* ── Drag behavior ──────────────────────────────────────────────── */
  const handle = panel.querySelector(".drag-handle");
  let startX, startY, startLeft, startTop;
  handle.addEventListener("pointerdown", e => {
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

  /* ── Auth button logic ──────────────────────────────────────────── */
  const auth = getAuth();
  const authButton = panel.querySelector("#auth-button");

  function updateAuthButton(user) {
    authButton.textContent = user ? "Log Out" : "Log In";
  }
  onAuthStateChanged(auth, user => updateAuthButton(user));

  authButton.addEventListener("click", async () => {
    if (auth.currentUser) {
      await signOut(auth);
    } else {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    }
  });
}

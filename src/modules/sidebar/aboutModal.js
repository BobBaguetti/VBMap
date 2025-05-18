// @file: src/modules/sidebar/aboutModal.js
// @version: 1.2 — switch to createAboutModal()

import { createAboutModal } from "../../../shared/ui/core/createAboutModal.js";

export function setupAboutModal({ buttonSelector }) {
  const btn = document.querySelector(buttonSelector);
  if (!btn) {
    console.warn("[aboutModal] Button not found:", buttonSelector);
    return;
  }

  // 1) Create modal via factory
  const { modal, slots } = createAboutModal({
    id:      "about-modal",
    title:   "About This Map",
    onClose: null
  });

  // 2) Populate body content
  slots.body.innerHTML = `
    <p><strong>Vaultbreakers Map</strong> is an unofficial community tool that
       helps you locate loot, quests, NPCs, and more. Data is synced in real-time
       from Firebase and curated by volunteer admins.</p>
    <p>
      <em>Version:</em> 0.9.0<br/>
      <em>Maintainer:</em> Vibecoder<br/>
      <em>GitHub:</em>
      <a href="https://github.com/Vibecoder/VBMap" target="_blank">VBMap&nbsp;repo</a>
    </p>
  `;

  // 3) Wire the toolbar button
  btn.addEventListener("click", () => modal.open());
}

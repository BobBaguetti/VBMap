// @file: src/authHandler.js
// @version: 5 — updated bootstrapUI import to new bootstrap folder

import { getAuth, onAuthStateChanged, getIdTokenResult } from "firebase/auth";
// authSetup.js now lives in src/
import { initAdminAuth } from "./authSetup.js";

// Point bootstrapUI at the new orchestrator
import { bootstrapUI } from "./bootstrap/index.js";

export function handleAuth() {
  const auth = getAuth();
  initAdminAuth();

  onAuthStateChanged(auth, async user => {
    const claims  = user ? (await getIdTokenResult(user)).claims : {};
    const isAdmin = Boolean(claims.admin);

    // Toggle admin-only UI
    document.body.classList.toggle("is-admin", isAdmin);

    // Once signed in, fire off the rest of the app
    if (user) {
      bootstrapUI(isAdmin);
    }
  });
}

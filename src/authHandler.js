// @file: src/authHandler.js
// @version: 6 — always bootstrap UI, even for guests

import { getAuth, onAuthStateChanged, getIdTokenResult } from "firebase/auth";
// authSetup.js now lives in src/
import { initAdminAuth } from "./authSetup.js";

// Point bootstrapUI at the new orchestrator
import { bootstrapUI } from "./bootstrap/index.js";

export function handleAuth() {
  const auth = getAuth();
  initAdminAuth();

  onAuthStateChanged(auth, async user => {
    // Get admin claim if signed in
    const claims  = user ? (await getIdTokenResult(user)).claims : {};
    const isAdmin = Boolean(claims.admin);

    // Toggle admin-only UI class
    document.body.classList.toggle("is-admin", isAdmin);

    // ALWAYS bootstrap the UI, passing only the isAdmin flag
    // (guest users = isAdmin false)
    bootstrapUI(isAdmin);
  });
}

// @file: src/authHandler.js
// Handles Firebase Auth state and gates admin UI

import { getAuth, onAuthStateChanged, getIdTokenResult } from "firebase/auth";
// authSetup.js now lives in src/
import { initAdminAuth } from "./authSetup.js";

import { bootstrapUI } from "./uiBootstrap.js";

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

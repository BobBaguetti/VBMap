// @file: /scripts/authSetup.js
// @version: 4

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged
} from "firebase/auth";

export function initAdminAuth() {
  const auth     = getAuth();
  const provider = new GoogleAuthProvider();

  const settingsSect = document.getElementById("settings-section");
  if (!settingsSect) {
    console.warn("[authSetup] #settings-section not found");
    return;
  }

  // Create the sign-in/out button
  const authBtn = document.createElement("button");
  authBtn.id        = "auth-btn";
  authBtn.className = "ui-button";
  settingsSect.prepend(authBtn);

  // Try to pick up a pending redirect result (so onAuthStateChanged fires correctly)
  getRedirectResult(auth).catch(err => {
    // ignore the "no auth event" error when there was no redirect to pick up
    if (err.code !== "auth/no-auth-event") {
      console.error("[authSetup] Redirect result error:", err);
    }
  });

  // Update UI whenever auth state changes
  onAuthStateChanged(auth, async user => {
    if (user) {
      // If we’re signed in, check for the custom 'admin' claim
      const { claims } = await user.getIdTokenResult();
      if (claims.admin) {
        authBtn.textContent = "Sign out";
        authBtn.onclick     = () => auth.signOut();
        document.querySelectorAll(".admin-only")
                .forEach(el => el.style.display = "");
        return;
      }
      // if not admin, force sign-out to reset everything
      await auth.signOut();
    }

    // No user or just signed out: show “Sign in” button
    authBtn.textContent = "Sign in";
    authBtn.onclick     = onSignInClick;
    document.querySelectorAll(".admin-only")
            .forEach(el => el.style.display = "none");
  });

  // Single click handler: popup → fallback to redirect (especially on GitHub Pages)
  async function onSignInClick() {
    const host = window.location.host.toLowerCase();
    // Force redirect on any *.github.io domain
    if (host.endsWith("github.io")) {
      return signInWithRedirect(auth, provider);
    }
    // Otherwise try popup first
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      // fallback on known popup/redirect errors
      if (
        e.code === "auth/operation-not-supported-in-this-environment" ||
        e.code === "auth/unauthorized-domain" ||
        e.code === "auth/browser-popup-blocked"
      ) {
        await signInWithRedirect(auth, provider);
      } else {
        console.error("[authSetup] Sign-in error:", e);
      }
    }
  }
}

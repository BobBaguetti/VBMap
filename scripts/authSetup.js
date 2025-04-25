// @file: /scripts/authSetup.js
// @version: 3

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

  const authBtn = document.createElement("button");
  authBtn.id        = "auth-btn";
  authBtn.className = "ui-button";
  settingsSect.prepend(authBtn);

  async function updateUI(user) {
    if (user) {
      const idToken = await user.getIdTokenResult();
      if (idToken.claims.admin) {
        authBtn.textContent = "Sign out";
        authBtn.onclick     = () => auth.signOut();
        document.querySelectorAll(".admin-only")
                .forEach(el => el.style.display = "");
        return;
      }
      await auth.signOut();
    }

    authBtn.textContent = "Sign in";
    authBtn.onclick     = onSignInClick;
    document.querySelectorAll(".admin-only")
            .forEach(el => el.style.display = "none");
  }

  async function onSignInClick() {
    // force redirect on GitHub Pages (or any domain you choose)
    const host = window.location.host.toLowerCase();
    if (host.endsWith("github.io")) {
      return signInWithRedirect(auth, provider);
    }

    // otherwise try popup → fallback to redirect
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      if (
        e.code === "auth/operation-not-supported-in-this-environment" ||
        e.code === "auth/unauthorized-domain" ||
        e.code === "auth/browser-popup-blocked"
      ) {
        await signInWithRedirect(auth, provider);
      } else {
        console.error("Sign-in error:", e);
      }
    }
  }

  // pick up a redirect result (so onAuthStateChanged still fires)
  getRedirectResult(auth).catch(err => {
    if (err.code !== "auth/no-auth-event") {
      console.error("Redirect result error:", err);
    }
  });

  onAuthStateChanged(auth, updateUI);
}

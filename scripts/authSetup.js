// @file: /scripts/authSetup.js
// @version: 2

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

  // Insert our button into the sidebar
  const settingsSect = document.getElementById("settings-section");
  if (!settingsSect) {
    console.warn("[authSetup] #settings-section not found");
    return;
  }

  const authBtn = document.createElement("button");
  authBtn.id        = "auth-btn";
  authBtn.className = "ui-button";
  settingsSect.prepend(authBtn);

  // Update button text + admin-only UI
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
      // if signed-in but not admin, immediately sign out
      await auth.signOut();
    }

    // no user → show Sign in
    authBtn.textContent = "Sign in";
    authBtn.onclick     = onSignInClick;
    document.querySelectorAll(".admin-only")
            .forEach(el => el.style.display = "none");
  }

  // Try popup, fallback to redirect on COOP / unsupported errors
  async function onSignInClick() {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      // if popup is blocked / not allowed → redirect flow
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

  // If we were redirected here, catch the result so onAuthStateChanged will fire
  getRedirectResult(auth).catch(err => {
    // ignore the “no auth event” when there's nothing to pick up
    if (err.code !== "auth/no-auth-event") console.error("Redirect result error:", err);
  });

  // Always update our UI when auth state changes
  onAuthStateChanged(auth, updateUI);
}

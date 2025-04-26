// @file: /scripts/authSetup.js
// @version: 5

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  getIdTokenResult
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

export function initAdminAuth() {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const settingsSect = document.getElementById("settings-section");

  if (!settingsSect) {
    console.warn("[authSetup] #settings-section not found");
    return;
  }

  // Create the sign-in/out button
  const authBtn = document.createElement("button");
  authBtn.id = "auth-btn";
  authBtn.className = "ui-button";
  settingsSect.prepend(authBtn);

  // Handle any pending redirect result (non-fatal)
  getRedirectResult(auth).catch(err => {
    if (err.code !== "auth/no-auth-event") {
      console.error("[authSetup] Redirect result error:", err);
    }
  });

  // Update UI on auth state changes
  onAuthStateChanged(auth, async user => {
    if (user) {
      const { claims } = await getIdTokenResult(user);
      if (claims.admin) {
        authBtn.textContent = "Sign out";
        authBtn.onclick     = () => auth.signOut();
        document.querySelectorAll(".admin-only")
                .forEach(el => el.style.display = "");
        return;
      }
      // not an admin → force sign-out
      await auth.signOut();
    }

    // no user or just signed out
    authBtn.textContent = "Sign in";
    authBtn.onclick     = onSignInClick;
    document.querySelectorAll(".admin-only")
            .forEach(el => el.style.display = "none");
  });

  // Always try popup first, fallback to redirect
  async function onSignInClick() {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.warn("[authSetup] Popup failed, falling back to redirect:", e);
      await signInWithRedirect(auth, provider);
    }
  }
}

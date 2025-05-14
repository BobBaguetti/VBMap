// @file: src/authSetup.js
// @version: 7 — inject auth button into sidebar toolbar instead of settings section

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  getIdTokenResult
} from "firebase/auth";

export function initAdminAuth() {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  // Find the toolbar container (under the logo)
  const toolbar = document.getElementById("sidebar-toolbar");
  if (!toolbar) {
    console.warn("[authSetup] #sidebar-toolbar not found");
    return;
  }

  // Create the Sign In/Out button and prepend it to the toolbar
  const authBtn = document.createElement("button");
  authBtn.id = "auth-btn";
  authBtn.className = "ui-button";
  toolbar.prepend(authBtn);

  // If a redirect result is pending, log it
  getRedirectResult(auth)
    .then(result => {
      if (result) {
        console.log("[authSetup] Redirect result:", result);
      }
    })
    .catch(err => {
      if (err.code !== "auth/no-auth-event") {
        console.error("[authSetup] Redirect error:", err);
      }
    });

  // Watch auth changes
  onAuthStateChanged(auth, async user => {
    console.log("[authSetup] onAuthStateChanged →", user);
    if (user) {
      // Force-refresh token to pick up any new custom claims
      const idTokenResult = await getIdTokenResult(user, /* forceRefresh */ true)
        .catch(err => {
          console.error("[authSetup] getIdTokenResult error:", err);
          return null;
        });
      console.log("[authSetup] ID token claims:", idTokenResult?.claims);

      const isAdmin = idTokenResult?.claims.admin === true;
      if (isAdmin) {
        authBtn.textContent = "Sign out";
        authBtn.onclick     = () => auth.signOut();
        document.querySelectorAll(".admin-only")
                .forEach(el => el.style.display = "");
        return;
      }

      console.warn("[authSetup] Signed in user is not admin; signing out");
      await auth.signOut();
    }

    // No user (or signed out)
    authBtn.textContent = "Sign in";
    authBtn.onclick     = onSignInClick;
    document.querySelectorAll(".admin-only")
            .forEach(el => el.style.display = "none");
  });

  // Always popup first...
  async function onSignInClick() {
    try {
      console.log("[authSetup] Attempting signInWithPopup");
      const result = await signInWithPopup(auth, provider);
      console.log("[authSetup] popup result:", result);
    } catch (e) {
      console.warn("[authSetup] Popup failed, falling back to redirect:", e);
      await signInWithRedirect(auth, provider);
    }
  }
}

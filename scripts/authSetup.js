// @file: /scripts/authSetup.js
// @version: 1

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
  } from "firebase/auth";
  
  export function initAdminAuth() {
    const auth     = getAuth();
    const provider = new GoogleAuthProvider();
  
    // This element only exists once the sidebar is built
    const settingsSect = document.getElementById("settings-section");
    if (!settingsSect) {
      console.warn("[authSetup] #settings-section not found");
      return;
    }
  
    const authBtn = document.createElement("button");
    authBtn.id        = "auth-btn";
    authBtn.className = "ui-button";
    settingsSect.prepend(authBtn);
  
    function updateUI(user) {
      if (user) {
        user.getIdTokenResult().then(idToken => {
          if (idToken.claims.admin) {
            authBtn.textContent = "Sign out";
            authBtn.onclick     = () => auth.signOut();
            document.querySelectorAll(".admin-only")
                    .forEach(el => el.style.display = "");
          } else {
            auth.signOut();
          }
        });
      } else {
        authBtn.textContent = "Sign in";
        authBtn.onclick     = () => signInWithPopup(auth, provider);
        document.querySelectorAll(".admin-only")
                .forEach(el => el.style.display = "none");
      }
    }
  
    onAuthStateChanged(auth, updateUI);
  }
  
// @file: src/shared/ui/utils/inputModality.js
// @version: 1.0 — track input modality (mouse vs keyboard)

(function() {
  // When the user presses Tab, add `.using-keyboard`; then listen for mouse to remove
  function onFirstTab(e) {
    if (e.key === "Tab") {
      document.body.classList.add("using-keyboard");
      window.removeEventListener("keydown", onFirstTab);
      window.addEventListener("mousedown", onMouseDownOnce);
    }
  }

  function onMouseDownOnce() {
    document.body.classList.remove("using-keyboard");
    window.removeEventListener("mousedown", onMouseDownOnce);
    window.addEventListener("keydown", onFirstTab);
  }

  window.addEventListener("keydown", onFirstTab);
})();

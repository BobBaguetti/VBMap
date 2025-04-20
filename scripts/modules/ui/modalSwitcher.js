// @version: 1
// @file: /scripts/modules/ui/modalSwitcher.js

/**
 * Attaches a popup modal switcher to a given <h2> title element.
 * @param {HTMLElement} titleEl - The <h2> element in the modal header
 * @param {Array<{ label: string, action: Function }>} options - List of options
 */
export function attachModalSwitcher(titleEl, options) {
    if (!titleEl) return;
  
    const popup = document.createElement("div");
    popup.className = "modal-switcher-popup";
    popup.style.display = "none";
    document.body.appendChild(popup);
  
    options.forEach(opt => {
      const div = document.createElement("div");
      div.className = "modal-switcher-option";
      div.textContent = opt.label;
      div.addEventListener("click", () => {
        hidePopup();
        opt.action();
      });
      popup.appendChild(div);
    });
  
    function showPopup() {
      const rect = titleEl.getBoundingClientRect();
      popup.style.left = `${rect.left}px`;
      popup.style.top = `${rect.bottom + 4}px`;
      popup.style.display = "block";
    }
  
    function hidePopup() {
      popup.style.display = "none";
    }
  
    // Toggle on click
    titleEl.addEventListener("click", (e) => {
      e.stopPropagation();
      popup.style.display === "block" ? hidePopup() : showPopup();
    });
  
    // Hide when clicking elsewhere
    document.addEventListener("click", (e) => {
      if (!popup.contains(e.target) && e.target !== titleEl) {
        hidePopup();
      }
    });
  }
  
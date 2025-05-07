// @version: 2
// @file: /scripts/modules/utils/scrollUtils.js

/**
 * Adds 'scrolling' class to elements while scrolling
 * used with .ui-scroll-float or scrollable forms.
 */
export function activateFloatingScrollbars() {
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll(".ui-scroll-float, form").forEach(el => {
        let timeout;
        el.addEventListener("scroll", () => {
          el.classList.add("scrolling");
          clearTimeout(timeout);
          timeout = setTimeout(() => el.classList.remove("scrolling"), 600);
        });
      });
    });
  }
  
// @version: 1
// @file: /scripts/modules/utils/scrollUtils.js

/**
 * Adds a 'scrolling' class to any .ui-scroll-float element during scroll,
 * which can be styled in CSS to show the scrollbar thumb.
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
  
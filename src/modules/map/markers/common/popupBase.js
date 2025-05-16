/* @file: src/modules/map/markers/common/popupBase.js */
/* @version: 1.0 — shared HTML wrapper for popups */

export function wrapPopup(innerHtml) {
  return `
    <div class="custom-popup" style="position:relative;">
      <span class="popup-close-btn" aria-label="Close">✖</span>
      ${innerHtml}
    </div>
  `;
}

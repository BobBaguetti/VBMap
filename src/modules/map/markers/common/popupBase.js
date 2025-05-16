// @file: src/modules/map/markers/common/popupBase.js
// @version: 1.0 — shared wrapper for all popups

export default function popupBase(innerHTML) {
  return `
    <div class="custom-popup" style="position:relative;">
      <span class="popup-close-btn" aria-label="Close">✖</span>
      ${innerHTML}
    </div>
  `;
}

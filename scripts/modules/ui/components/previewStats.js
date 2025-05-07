// @file: /scripts/modules/ui/components/previewStats.js
// @version: 1.0 - shared preview stats component

/**
 * Render the stats HTML for a preview panel.
 *
 * @param {Object} fields - key/value pairs of stat name and value
 * @returns {string} HTML string for the stats section
 */
export function renderPreviewStats(fields) {
    return `
      <div class="preview-stats">
        ${Object.entries(fields)
          .map(
            ([key, value]) =>
              `<div class="preview-stat-row"><strong>${key}:</strong> ${value}</div>`
          )
          .join("")}
      </div>
    `;
  }
  
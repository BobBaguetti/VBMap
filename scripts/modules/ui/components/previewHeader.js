// @file: /scripts/modules/ui/components/previewHeader.js
// @version: 1.0 - shared preview header component

/**
 * Render the header HTML for a preview panel.
 *
 * @param {Object} opts
 * @param {string} opts.iconUrl      - URL of the icon (img src)
 * @param {string} opts.title        - Title text (e.g. name of the entity)
 * @param {string} [opts.titleClass] - Optional CSS class for styling the title
 * @returns {string} HTML string for the preview header
 */
export function renderPreviewHeader({ iconUrl, title, titleClass = "" }) {
    return `
      <div class="preview-header ${titleClass}">
        ${iconUrl
          ? `<img src="${iconUrl}" alt="" class="preview-header-icon" />`
          : ""}
        <span class="preview-header-title">${title}</span>
      </div>
    `;
  }
  
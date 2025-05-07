// @file: scripts/modules/ui/previewFactory/index.js
// @version: 1

/**
 * Generates a preview DOM node based on a schema.
 * @param {Object} data             The definition object.
 * @param {Array}  schema           Array of field defs.
 * @param {Object} customRenderers  Map fieldName → (value, data) => HTMLElement
 * @returns {HTMLElement}
 */
export function createPreview(data, schema, customRenderers = {}) {
    const container = document.createElement("div");
    container.className = "definition-preview";
  
    schema.forEach(field => {
      const row = document.createElement("div");
      row.className = "preview-row";
  
      const label = document.createElement("span");
      label.className = "preview-label";
      label.textContent = field.label + ": ";
      row.appendChild(label);
  
      let content;
      if (customRenderers[field.name]) {
        content = customRenderers[field.name](data[field.name], data);
      } else {
        content = document.createElement("span");
        content.className = "preview-value";
        if (Array.isArray(data[field.name])) {
          content.textContent = data[field.name].join(", ");
        } else {
          content.textContent = data[field.name] ?? "";
        }
      }
      row.appendChild(content);
      container.appendChild(row);
    });
  
    return container;
  }
  
// @file: /scripts/modules/ui/components/formButtonRow.js
// @version: 1.0 – extracted from uiKit.js

/**
 * Standard row containing a Save (submit) button and a Cancel button.
 *
 * @param {() => void} onCancel   – callback when Cancel is clicked
 * @param {string} [saveText="Save"]
 * @param {string} [cancelText="Cancel"]
 * @returns {HTMLElement}  – the row element
 */
export function createFormButtonRow(onCancel, saveText = "Save", cancelText = "Cancel") {
    const row = document.createElement("div");
    row.className = "field-row";
    row.style.justifyContent = "center";
    row.style.marginTop = "10px";
  
    const btnSave = document.createElement("button");
    btnSave.type = "submit";
    btnSave.className = "ui-button";
    btnSave.textContent = saveText;
  
    const btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.className = "ui-button";
    btnCancel.textContent = cancelText;
    btnCancel.onclick = onCancel;
  
    row.append(btnSave, btnCancel);
    return row;
  }
  
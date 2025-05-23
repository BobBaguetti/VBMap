// @file: src/modules/definition/form/controller/formHeaderManager.js
// @version: 1.0 — encapsulate modal header & subheader setup

import { createFormControllerHeader } from "./formControllerShell.js";

/**
 * Sets up the modal header + subheader controls.
 *
 * @param {HTMLFormElement} form
 * @param {string}          title
 * @param {boolean}         hasFilter
 * @param {() => void}      onCancel
 * @param {() => void}      onDelete
 * @param {(payload: object) => void} onFilter
 * @returns {{
 *   headerWrap: HTMLElement,
 *   subheading: HTMLElement,
 *   filterCheckbox: HTMLInputElement,
 *   setDeleteVisible: (visible: boolean) => void
 * }}
 */
export function setupFormHeader({ form, title, hasFilter, onCancel, onDelete, onFilter }) {
  const {
    container: headerWrap,
    subheading,
    filterCheckbox,
    setDeleteVisible
  } = createFormControllerHeader({
    title,
    hasFilter: !!hasFilter,
    onFilter:   () => onFilter(),
    onCancel,
    onDelete:   () => {
      if (confirm(`Delete this ${title}?`)) {
        onDelete();
      }
    }
  });

  headerWrap.classList.add("modal-subheader");
  // inject into form
  form.prepend(headerWrap);
  // by default hide the delete button until populate shows it
  setDeleteVisible(false);

  return { headerWrap, subheading, filterCheckbox, setDeleteVisible };
}

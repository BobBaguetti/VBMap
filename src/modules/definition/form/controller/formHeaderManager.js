// @file: src/modules/definition/form/controller/formHeaderManager.js
// @version: 1.0 — centralize modal header, filter, delete-confirm, and save-button logic

import { createFormControllerHeader } from "./formControllerShell.js";

/**
 * Sets up the modal header & toolbar for a definition form.
 *
 * @param {HTMLFormElement} form
 * @param {string} title
 * @param {boolean} hasFilter
 * @param {Function} onFilter       — called when filter toggles
 * @param {Function} onCancel       — called when cancel is clicked
 * @param {Function} onDelete       — called when confirmed delete
 * @param {Function} getPayload     — returns current payload for delete id
 * @param {Function} onSubmit       — called when save is clicked
 * @returns {{ headerWrap:HTMLElement, subheading:HTMLElement, filterCheckbox:HTMLInputElement, setDeleteVisible:Function }}
 */
export function setupFormHeader({
  form,
  title,
  hasFilter,
  onFilter,
  onCancel,
  onDelete,
  getPayload,
  onSubmit
}) {
  const {
    container: headerWrap,
    subheading,
    filterCheckbox,
    setDeleteVisible
  } = createFormControllerHeader({
    title,
    hasFilter,
    onFilter,
    onCancel,
    onDelete: () => {
      const { id } = getPayload();
      if (id != null && confirm(`Delete this ${title}?`)) {
        onDelete(id);
      }
    }
  });

  headerWrap.classList.add("modal-subheader");
  setDeleteVisible(false);
  form.prepend(headerWrap);

  // Wire save button
  const saveBtn = headerWrap.querySelector('button[type="submit"]');
  if (saveBtn) {
    saveBtn.type = "button";
    saveBtn.addEventListener("click", async e => {
      e.preventDefault();
      await onSubmit(getPayload());
    });
  }

  return { headerWrap, subheading, filterCheckbox, setDeleteVisible };
}

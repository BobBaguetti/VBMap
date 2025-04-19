// @version: test
// @file: /scripts/modules/ui/modals/markerForm.js

import { createModal, openModal, closeModal, makeModalDraggable, createModalHeader } from "../uiKit.js";

export function initMarkerForm() {
  const { modal } = createModal({ id: "edit-marker-modal", size: "small" });

  const header = createModalHeader("Test Marker Modal", () => closeModal(modal));
  modal.appendChild(header);
  makeModalDraggable(modal, header);

  const form = document.createElement("form");
  form.id = "edit-form";

  const input = document.createElement("input");
  input.className = "ui-input";
  input.placeholder = "Test input";

  const submit = document.createElement("button");
  submit.className = "ui-button";
  submit.textContent = "Submit";
  submit.type = "submit";

  form.append(input, submit);
  modal.appendChild(form);

  document.body.appendChild(modal);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Test modal submitted:", input.value);
    closeModal(modal);
  });

  function openCreate(evt) {
    modal.style.left = evt.clientX + "px";
    modal.style.top = evt.clientY + "px";
    modal.style.position = "absolute";
    openModal(modal);
  }

  return { openCreate };
}
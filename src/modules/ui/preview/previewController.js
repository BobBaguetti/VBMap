// @file: src/modules/ui/preview/previewController.js
// @version: 1.3 — live-preview reads form values instead of relying on previewApi internals

import { createPreviewPanel } from "./createPreviewPanel.js";

/**
 * Encapsulates preview panel creation, positioning, show/hide,
 * and live-wiring to form inputs by reading form data.
 *
 * @param {string} type — "item" or "chest"
 */
export function createPreviewController(type) {
  // 1) panel container
  const container = document.createElement("div");
  container.style.zIndex = "1101";
  document.body.appendChild(container);

  // 2) panel API
  const previewApi = createPreviewPanel(type, container);

  // 3) helper to find the modal's form
  function findForm() {
    const modal = document.getElementById(`${type}-definitions-modal`);
    return modal?.querySelector("form");
  }

  // 4) function to read form into data object
  function getFormData() {
    const form = findForm();
    if (!form) return {};
    const fd = new FormData(form);
    // For checkbox fields (addToFilters), FormData omits unchecked—handle if needed
    return Object.fromEntries(fd.entries());
  }

  // 5) position & show logic
  function positionAndShow(data) {
    previewApi.setFromDefinition(data);
    previewApi.show();

    // now that content is rendered, measure & position
    const mc = document.querySelector(".modal-content")?.getBoundingClientRect();
    const pr = container.getBoundingClientRect();
    if (mc && pr.height) {
      container.style.position = "absolute";
      container.style.left     = `${mc.right + 30}px`;
      container.style.top      = `${mc.top + (mc.height/2) - (pr.height/2)}px`;
    }
  }

  // 6) wire live updates once
  let wired = false;
  function wireLivePreview() {
    if (wired) return;
    const form = findForm();
    if (!form) return;

    const handler = () => {
      const data = getFormData();
      positionAndShow(data);
    };

    form.querySelectorAll("input, select, textarea").forEach(el => {
      const evt = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evt, handler);
    });

    wired = true;
  }

  // 7) public show/hide
  return {
    show(data) {
      positionAndShow(data);
      wireLivePreview();
    },
    hide: () => previewApi.hide()
  };
}
